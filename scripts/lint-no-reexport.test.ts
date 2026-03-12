import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { analyzePureReexports } from './lint-no-reexport'

async function writeProjectFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

describe('lint-no-reexport', () => {
  let tempDir: string

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'lint-no-reexport-'))

    await writeProjectFile(
      tempDir,
      'src/features/pure.ts',
      `export * from './source'`,
    )

    await writeProjectFile(
      tempDir,
      'src/features/named.ts',
      `export { value } from './source'`,
    )

    await writeProjectFile(
      tempDir,
      'src/features/mixed.ts',
      `
import { value } from './source'
export { other } from './source'
export const localValue = value
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/type-only.ts',
      `export type { Value } from './source'`,
    )

    await writeProjectFile(
      tempDir,
      'src/features/source.ts',
      `export const value = 1`,
    )

    await writeProjectFile(
      tempDir,
      'src/features/ignored.test.ts',
      `export * from './source'`,
    )
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('reports files composed only of export-from statements', () => {
    expect(analyzePureReexports({ projectRoot: tempDir })).toEqual([
      { filePath: 'src/features/named.ts' },
      { filePath: 'src/features/pure.ts' },
      { filePath: 'src/features/type-only.ts' },
    ])
  })

  test('ignores mixed modules and test files', () => {
    const issues = analyzePureReexports({ projectRoot: tempDir })

    expect(issues).not.toContainEqual({ filePath: 'src/features/mixed.ts' })
    expect(issues).not.toContainEqual({ filePath: 'src/features/ignored.test.ts' })
  })
})
