import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { analyzeSymbolOwnership } from './lint-symbol-ownership'

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
export const sharedAcrossRoutes = (value: number) => value * 2
export type SharedType = { id: string }
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/notes/_features/use-add.ts',
      `
import { add, sharedAcrossRoutes } from '@/features/shared/math'

export const useAdd = () => add(1, 2) + sharedAcrossRoutes(3)
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/pointers/_features/use-shared.ts',
      `
import { sharedAcrossRoutes } from '@/features/shared/math'

export const useShared = () => sharedAcrossRoutes(3)
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

  test('reports demote candidates in shared layers when only one owner imports them', () => {
    expect(issues).toContainEqual({
      kind: 'demote',
      symbolName: 'add',
      declarationFile: 'src/features/shared/math.ts',
      declarationOwner: 'features/shared',
      referenceOwners: ['route/notes'],
    })
  })

  test('does not report shared symbols that are used by multiple owners', () => {
    expect(
      issues.find(
        (issue) =>
          issue.declarationFile === 'src/features/shared/math.ts' &&
          issue.symbolName === 'sharedAcrossRoutes',
      ),
    ).toBeUndefined()
  })

  test('reports promote candidates when route-local exports are imported by another owner', () => {
    expect(issues).toContainEqual({
      kind: 'promote',
      symbolName: 'localAction',
      declarationFile: 'src/app/[locale]/(main)/notes/_features/note-actions.ts',
      declarationOwner: 'route/notes',
      referenceOwners: ['route/pointers'],
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
