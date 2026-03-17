import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { analyzeForbiddenFiles } from './forbidden-files'
import { analyzeRestrictedImportUsage } from './restricted-import-usage'
import { analyzeServerActionGuards } from './server-action-guards'

async function writeProjectFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

describe('restricted-import-usage', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'lint-site-rules-'))

    await writeProjectFile(
      tempDir,
      'vsa.config.json',
      JSON.stringify({
        siteRules: {
          authGuardIdentifiers: ['hasEditorAdminSession', 'requireEditorAdminSession'],
          forbiddenFiles: ['middleware.ts', 'src/middleware.ts'],
          nextServerApiAllowedPrefixes: ['src/app/'],
          serverActionExceptions: ['loginEditorAdminAction', 'logoutEditorAdminAction'],
          serverActionRoots: ['src/app/[locale]/(admin)/editor/_features'],
          storageOwnerRoots: ['src/lib/content-store/'],
          zodAllowedSuffixes: ['.assemble.ts', '.infra.ts'],
        },
      }),
    )

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

    await writeProjectFile(tempDir, 'src/middleware.ts', 'export function middleware() {}')

    await writeProjectFile(
      tempDir,
      'src/features/misplaced/storage.ts',
      `
import { readFile } from 'node:fs/promises'

export async function loadStorage() {
  return readFile('storage/editor/notes.json', 'utf8')
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/misplaced/schema.ts',
      `
import { z } from 'zod'

export const Schema = z.object({ id: z.string() })
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/misplaced/server-api.ts',
      `
import { cookies } from 'next/headers'

export async function readCookies() {
  return cookies()
}
      `.trim(),
    )
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('reports admin server actions that skip the auth guard', () => {
    expect(analyzeServerActionGuards({ projectRoot: tempDir })).toContainEqual({
      filePath: 'src/app/[locale]/(admin)/editor/_features/actions.ts',
      symbolName: 'saveEditorCollectionAction',
      message:
        'server actions under configured roots must call one of the configured auth guards',
    })
  })

  test('allows explicit login/logout exceptions and guarded actions', () => {
    const issues = analyzeServerActionGuards({ projectRoot: tempDir })

    expect(
      issues.find(
        (issue) =>
          issue.symbolName === 'loginEditorAdminAction',
      ),
    ).toBeUndefined()
    expect(
      issues.find(
        (issue) =>
          issue.filePath.endsWith('metadata.actions.ts'),
      ),
    ).toBeUndefined()
  })

  test('reports forbidden framework files', () => {
    const issues = analyzeForbiddenFiles({ projectRoot: tempDir })

    expect(issues).toContainEqual({
      filePath: 'src/middleware.ts',
      message: 'This project forbids these framework-level files in favor of the configured replacement.',
    })
  })

  test('reports storage owner, zod owner, and next server api owner drift', () => {
    const issues = analyzeRestrictedImportUsage({ projectRoot: tempDir })

    expect(issues).toContainEqual({
      filePath: 'src/features/misplaced/storage.ts',
      ruleName: 'storage-owner',
      message:
        'storage access must be owned by the configured storage modules',
    })
    expect(issues).toContainEqual({
      filePath: 'src/features/misplaced/schema.ts',
      ruleName: 'zod-owner',
      message:
        'zod usage must be owned by the configured validation modules',
    })
    expect(issues).toContainEqual({
      filePath: 'src/features/misplaced/server-api.ts',
      ruleName: 'next-server-api-owner',
      message:
        'Next server APIs must be owned by the configured server-entry modules',
    })
  })
})
