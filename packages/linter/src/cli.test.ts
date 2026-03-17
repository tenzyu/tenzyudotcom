import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runCli } from './cli'

const cleanupDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

async function createProject(files: Record<string, string>) {
  const dir = await mkdtemp(path.join(tmpdir(), 'linter-cli-'))
  cleanupDirs.push(dir)

  await Promise.all(
    Object.entries(files).map(async ([relativePath, content]) => {
      const absolutePath = path.join(dir, relativePath)
      await mkdir(path.dirname(absolutePath), { recursive: true })
      await writeFile(absolutePath, content, 'utf8')
    }),
  )

  return dir
}

describe('runCli', () => {
  test('runs selected rules against an explicit project root', async () => {
    const projectRoot = await createProject({
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          baseUrl: '.',
          paths: {
            '@/*': ['./src/*'],
          },
        },
        include: ['src/**/*.ts'],
      }),
      'src/reexport.ts': "export { foo } from './source'\n",
      'src/source.ts': 'export const foo = 1\n',
    })

    const messages: string[] = []
    const originalError = console.error
    console.error = (...args: unknown[]) => {
      messages.push(args.join(' '))
    }

    try {
      const exitCode = await runCli([
        'no-reexport',
        '--project-root',
        projectRoot,
      ])

      expect(exitCode).toBe(1)
      expect(messages.some((message) => message.includes('pure re-export files are prohibited'))).toBeTrue()
    } finally {
      console.error = originalError
    }
  })
})
