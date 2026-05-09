import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { analyzeSymbolOwnership } from './symbol-ownership'

async function writeProjectFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

describe('lint-symbol-ownership', () => {
  let tempDir: string
  let issues: ReturnType<typeof analyzeSymbolOwnership>

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'lint-symbol-ownership-'))

    await writeProjectFile(
      tempDir,
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
          },
        },
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      }),
    )

    await writeProjectFile(
      tempDir,
      'src/features/shared/math.ts',
      `
export const add = (a: number, b: number) => a + b
export const sharedAcrossMain = (value: number) => value * 2
export type SharedType = { id: string }
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/notes/_features/use-add.ts',
      `
import { add, sharedAcrossMain } from '@/features/shared/math'

export const useAdd = () => add(1, 2) + sharedAcrossMain(3)
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/pointers/_features/use-shared.ts',
      `
import { sharedAcrossMain } from '@/features/shared/math'

export const useShared = () => sharedAcrossMain(3)
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/notes/_features/note-actions.ts',
      `
export function localAction() {
  return 'note'
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/pointers/_features/consume-note-action.ts',
      `
import { localAction } from '@/app/[locale]/(main)/notes/_features/note-actions'

export const consumeNoteAction = () => localAction()
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/blog/[slug]/_features/slug-page-data.ts',
      `
export function buildSlugPageData() {
  return 'slug'
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/blog/_features/blog-list-data.ts',
      `
import { buildSlugPageData } from '@/app/[locale]/(main)/blog/[slug]/_features/slug-page-data'

export const listData = () => buildSlugPageData()
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/notes/_features/type-only.ts',
      `
import type { SharedType } from '@/features/shared/math'

export type Local = SharedType
      `.trim(),
    )

    issues = analyzeSymbolOwnership({
      projectRoot: tempDir,
      tsconfigPath: path.join(tempDir, 'tsconfig.json'),
    })
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('reports demote candidates in shared layers when only one app owner imports them', () => {
    expect(issues).toContainEqual({
      kind: 'demote',
      symbolName: 'add',
      declarationFile: 'src/features/shared/math.ts',
      declarationOwner: 'src/features/shared',
      referenceOwners: ['src/app/[locale]/(main)/notes'],
      targetOwner: 'src/app/[locale]/(main)/notes',
    })
  })

  test('reports demote candidates in shared layers to the least common app owner', () => {
    expect(issues).toContainEqual({
      kind: 'demote',
      symbolName: 'sharedAcrossMain',
      declarationFile: 'src/features/shared/math.ts',
      declarationOwner: 'src/features/shared',
      referenceOwners: [
        'src/app/[locale]/(main)/notes',
        'src/app/[locale]/(main)/pointers',
      ],
      targetOwner: 'src/app/[locale]/(main)',
    })
  })

  test('reports promote candidates when app-owned exports are imported by sibling owners', () => {
    expect(issues).toContainEqual({
      kind: 'promote',
      symbolName: 'localAction',
      declarationFile: 'src/app/[locale]/(main)/notes/_features/note-actions.ts',
      declarationOwner: 'src/app/[locale]/(main)/notes',
      referenceOwners: ['src/app/[locale]/(main)/pointers'],
      targetOwner: 'src/app/[locale]/(main)',
    })
  })

  test('reports promote candidates to a nested least common owner when possible', () => {
    expect(issues).toContainEqual({
      kind: 'promote',
      symbolName: 'buildSlugPageData',
      declarationFile:
        'src/app/[locale]/(main)/blog/[slug]/_features/slug-page-data.ts',
      declarationOwner: 'src/app/[locale]/(main)/blog/[slug]',
      referenceOwners: ['src/app/[locale]/(main)/blog'],
      targetOwner: 'src/app/[locale]/(main)/blog',
    })
  })

  test('ignores type-only imports by excluding non-value symbols from analysis', () => {
    expect(
      issues.find(
        (issue) =>
          issue.declarationFile === 'src/features/shared/math.ts' &&
          issue.symbolName === 'SharedType',
      ),
    ).toBeUndefined()
  })
})
