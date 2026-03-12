import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { analyzeSiteRules } from './lint-site-rules'

async function writeProjectFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

describe('lint-site-rules', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'lint-site-rules-'))

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(admin)/editor/_features/actions.ts',
      `
'use server'

export async function saveEditorCollectionAction() {
  return { ok: true }
}

export async function loginEditorAdminAction() {
  return { ok: true }
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(admin)/editor/_features/metadata.actions.ts',
      `
'use server'

export async function fetchUrlMetadataAction() {
  await hasEditorAdminSession()
  return { ok: true }
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/lib/editor/editor.domain.ts',
      `
export type EditorCollectionId =
  | 'notes'
  | 'blog'
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(admin)/editor/_features/editor.collections.ts',
      `
export const EDITOR_COLLECTIONS = {
  notes: NOTES_COLLECTION_DESCRIPTOR,
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/editor-collections/notes.ts',
      `
import type { EditorCollectionDescriptor } from '@/lib/editor/editor.port'

export const NOTES_COLLECTION_DESCRIPTOR: EditorCollectionDescriptor<'notes'> = {
  id: 'notes',
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/editor-collections/blog.ts',
      `
import type { EditorCollectionDescriptor } from '@/lib/editor/editor.port'

export const BLOG_COLLECTION_DESCRIPTOR: EditorCollectionDescriptor<'blog'> = {
  id: 'blog',
}
      `.trim(),
    )

    await writeProjectFile(tempDir, 'src/middleware.ts', 'export function middleware() {}')
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('reports admin server actions that skip the auth guard', () => {
    expect(analyzeSiteRules({ projectRoot: tempDir })).toContainEqual({
      kind: 'server-action-auth',
      filePath: 'src/app/[locale]/(admin)/editor/_features/actions.ts',
      symbolName: 'saveEditorCollectionAction',
      message:
        'admin server actions must call hasEditorAdminSession or requireEditorAdminSession',
    })
  })

  test('allows explicit login/logout exceptions and guarded actions', () => {
    const issues = analyzeSiteRules({ projectRoot: tempDir })

    expect(
      issues.find(
        (issue) =>
          issue.kind === 'server-action-auth' &&
          issue.symbolName === 'loginEditorAdminAction',
      ),
    ).toBeUndefined()
    expect(
      issues.find(
        (issue) =>
          issue.kind === 'server-action-auth' &&
          issue.filePath.endsWith('metadata.actions.ts'),
      ),
    ).toBeUndefined()
  })

  test('reports middleware.ts and editor collection registry drift', () => {
    const issues = analyzeSiteRules({ projectRoot: tempDir })

    expect(issues).toContainEqual({
      kind: 'middleware-file',
      filePath: 'src/middleware.ts',
      message: 'Next.js 16 projects must use proxy.ts instead of middleware.ts',
    })
    expect(issues).toContainEqual({
      kind: 'editor-collection-registry',
      filePath: 'src/app/[locale]/(admin)/editor/_features/editor.collections.ts',
      message:
        "collection 'blog' exists in EditorCollectionId but is missing from EDITOR_COLLECTIONS",
    })
  })
})
