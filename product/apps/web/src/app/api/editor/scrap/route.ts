import { NextResponse } from 'next/server'
import {
  hasEditorAdminSession,
  isSameOriginEditorRequest,
} from '@/features/editor-auth/editor-session'
import {
  checkScrapPublication,
  executeScrapEditorCommand,
  loadScrapEditorIndex,
  loadScrapEditorState,
} from '@/features/content-editor/scrap-editor.assemble'
import { isEditorValidationError } from '@/features/content-editor/editor.validation'
import { ScrapWorkspaceRequest } from './scrap-workspace-request.validation'
import { isValidScrapSlug } from '@/features/scraps/scraps.domain'
import {
  isStorageCommitUncertain,
  isStorageVersionConflict,
} from '@/lib/content-store/content-store.domain'

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  })
}

export async function GET(request: Request) {
  if (!(await hasEditorAdminSession())) return json({ kind: 'denied' }, 401)
  const slug = new URL(request.url).searchParams.get('slug')
  try {
    if (slug === null) return json(await loadScrapEditorIndex())
    if (!isValidScrapSlug(slug)) return json({ kind: 'invalid' }, 400)
    const view = await loadScrapEditorState(slug)
    return view ? json(view) : json({ kind: 'invalid' }, 404)
  } catch (error) {
    console.error('Unable to read Scrap editor data', error)
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

  const parsed = ScrapWorkspaceRequest.safeParse(
    await request.json().catch(() => null),
  )
  if (!parsed.success) {
    return json(
      { kind: 'invalid', message: 'Check the Scrap fields and try again.' },
      400,
    )
  }
  const input = parsed.data
  try {
    if (input.operation === 'save') {
      const { version } = await executeScrapEditorCommand(input.command)
      return json({ kind: 'saved', version })
    }
    const outcome = await checkScrapPublication(
      input.candidate,
      input.expectedVersion,
    )
    if (outcome === 'saved') {
      return json({ kind: 'saved', version: input.candidate })
    }
    if (outcome === 'retry') {
      return json({
        kind: 'retry',
        message:
          'Git still matches your starting revision. You can retry this draft.',
      })
    }
    return json({
      kind: 'uncertain',
      candidate: input.candidate,
      message: 'This commit is still unconfirmed. Your draft is kept.',
    })
  } catch (error) {
    if (isStorageCommitUncertain(error)) {
      return json({
        kind: 'uncertain',
        candidate: error.candidateOid,
        message: 'The save outcome is unknown. Check Git before retrying.',
      })
    }
    if (isStorageVersionConflict(error)) {
      return json(
        {
          kind: 'conflict',
          message: 'Git changed. Compare your draft with the saved version.',
        },
        409,
      )
    }
    if (isEditorValidationError(error)) {
      return json(
        { kind: 'invalid', message: 'Check the Scrap fields and try again.' },
        400,
      )
    }
    console.error('Unable to process Scrap editor command', error)
    return json(
      {
        kind: 'unavailable',
        message: 'Storage is unavailable. Your draft is kept.',
      },
      503,
    )
  }
}
