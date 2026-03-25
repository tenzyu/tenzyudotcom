import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

describe('migrate-notes-threading script', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'migrate-notes-threading-test-'))
  })

  afterAll(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  const runScript = (args: string[]) => {
    const scriptPath = resolve(process.cwd(), 'scripts/migrate-notes-threading.ts')
    return Bun.spawnSync(['bun', scriptPath, ...args], {
      cwd: tmpDir,
      env: { ...process.env },
      stderr: 'pipe',
      stdout: 'pipe',
    })
  }

  test('migrates legacy notes in place by adding deterministic ids', () => {
    const notesPath = join(tmpDir, 'notes.json')

    writeFileSync(
      notesPath,
      JSON.stringify(
        [
          {
            body: {
              ja: 'legacy note',
            },
            createdAt: '2026-03-25T12:10:10.284Z',
            published: true,
          },
        ],
        null,
        2,
      ),
    )

    const result = runScript(['notes.json'])

    expect(result.success).toBe(true)

    const migrated = JSON.parse(readFileSync(notesPath, 'utf8')) as Array<{
      id: string
      body: { ja: string; en: string }
      createdAt: string
    }>

    expect(migrated).toEqual([
      {
        id: '2026-03-25T12:10:10.284Z',
        body: {
          ja: 'legacy note',
          en: '',
        },
        createdAt: '2026-03-25T12:10:10.284Z',
        published: true,
      },
    ])
  })
})
