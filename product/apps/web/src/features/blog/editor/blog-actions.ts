'use server'

import {
  StorageCommitUncertainError,
  StorageError,
  StorageVersionConflictError,
} from '@tenzyu/revisioned-content/contracts'
import { githubContentRepository } from '@/platform/content-store/github-content.infra'
import {
  requireEditorSameOriginRequest,
  requireEditorAdminSession,
} from '@/features/editor-auth/editor-session'
import type { BlogSaveCommand } from '@tenzyu/publishing-domain/blog'
import { saveBlogPost } from '../blog.infra'
import { parseEditorBlogSaveInput } from './blog-save-input'
import { confirmBlogPublication, type SaveBlogPostActionState } from './blog-save-form-state'

async function publishEditorBlog(command: BlogSaveCommand) {
  return confirmBlogPublication(await saveBlogPost(command))
}

async function checkEditorBlogPublication(candidateOid: string) {
  const headOid = await githubContentRepository.reconcile(candidateOid)
  return headOid
    ? confirmBlogPublication({
        commitOid: candidateOid,
        headOid,
        status: 'reconciled',
      })
    : null
}

export async function saveBlogPostAction(
  previous: SaveBlogPostActionState,
  formData: FormData,
): Promise<SaveBlogPostActionState> {
  const locale = formData.get('locale') === 'en' ? 'en' : 'ja'
  await requireEditorSameOriginRequest()
  await requireEditorAdminSession(locale)
  if (previous.status === 'uncertain') {
    if (formData.get('operation') !== 'reconcile') return previous
    const result = await checkEditorBlogPublication(
      previous.candidateOid,
    ).catch(() => null)
    return (
      result ?? {
        ...previous,
        message:
          'Publication is still unconfirmed. Keep your draft and inspect the latest revision before submitting again.',
      }
    )
  }

  const parsed = parseEditorBlogSaveInput(formData)
  if (!parsed.success)
    return { status: 'error', error: parsed.error, message: parsed.message }

  try {
    return await publishEditorBlog(parsed.command)
  } catch (error) {
    if (error instanceof StorageCommitUncertainError) {
      return {
        status: 'uncertain',
        candidateOid: error.candidateOid,
        message:
          'Publication outcome unknown. Your draft is still here. Check publication before retrying.',
      }
    }
    if (error instanceof StorageVersionConflictError) {
      return {
        status: 'error',
        error: 'conflict',
        message: error.message,
      }
    }
    return {
      status: 'error',
      error: 'save',
      message:
        error instanceof StorageError
          ? `${error.message} Your draft has been kept.`
          : 'Failed to save the blog post. Your draft has been kept.',
    }
  }
}
