import { NextResponse } from 'next/server'
import { parseBlogSaveCommand } from '@/features/blog/editor/blog-save-input'
import { BlogSlugValidationError } from '@tenzyu/publishing-domain/blog'
import {
  checkBlogWorkspacePublication,
  readEditableBlogArticle,
  renameBlogPost,
  saveBlogPost,
} from '@/features/blog/blog-workspace.assemble'
import { BlogWorkspaceRequestSchema } from '@/features/blog/editor/blog-workspace.validation'
import {
  hasEditorAdminSession,
  isSameOriginEditorRequest,
} from '@/features/editor-auth/editor-session'
import {
  isStorageCommitUncertain,
  isStorageVersionConflict,
} from '@tenzyu/revisioned-content/contracts'

function json(value: unknown, status = 200) {
  return NextResponse.json(value, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export async function GET(request: Request) {
  if (!(await hasEditorAdminSession())) return json({ kind: 'denied' }, 401)
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug) return json({ kind: 'invalid' }, 400)
  try {
    const view = await readEditableBlogArticle(slug)
    return view ? json(view) : json({ kind: 'invalid' }, 404)
  } catch (error) {
    console.error('Unable to read Blog editor data', error)
    return json({ kind: 'unavailable' }, 503)
  }
}

export async function POST(request: Request) {
  if (!request.headers.has('origin') || !isSameOriginEditorRequest(request)) {
    return json(
      { kind: 'denied', message: 'The request origin is invalid.' },
      403,
    )
  }
  if (!(await hasEditorAdminSession())) {
    return json({ kind: 'denied', message: 'Your session has expired.' }, 401)
  }

  const parsed = BlogWorkspaceRequestSchema.safeParse(
    await request.json().catch(() => null),
  )
  if (!parsed.success)
    return json({ kind: 'invalid', message: 'Check the Blog fields.' }, 400)
  const input = parsed.data
  try {
    switch (input.operation) {
      case 'check': {
        const result = await checkBlogWorkspacePublication(
          input.slug,
          input.candidate,
        )
        return result
          ? json({ kind: 'saved', ...result })
          : json({
              kind: 'uncertain',
              candidateOid: input.candidate,
              message: 'Publication is still unconfirmed. Your draft is kept.',
            })
      }
      case 'rename':
        return json({ kind: 'saved', receipt: await renameBlogPost(input) })
      case 'save': {
        const command = parseBlogSaveCommand(input)
        if (!command.success)
          return json(
            { kind: command.error, message: command.message },
            command.error === 'conflict' ? 409 : 400,
          )
        return json({
          kind: 'saved',
          receipt: await saveBlogPost(command.command),
        })
      }
    }
  } catch (error) {
    if (isStorageCommitUncertain(error))
      return json({
        kind: 'uncertain',
        candidateOid: error.candidateOid,
        message: 'Publication outcome unknown. Check Git before retrying.',
      })
    if (isStorageVersionConflict(error))
      return json({ kind: 'conflict', message: error.message }, 409)
    if (error instanceof BlogSlugValidationError)
      return json({ kind: 'invalid', message: error.message }, 400)
    console.error('Unable to process Blog editor command', error)
    return json(
      {
        kind: 'unavailable',
        message: 'Storage is unavailable. Your draft is kept.',
      },
      503,
    )
  }
}
