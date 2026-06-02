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
    const scriptPath = resolve(import.meta.dir, 'migrate-notes-threading.ts')
    return Bun.spawnSync(['bun', scriptPath, ...args], {
      cwd: tmpDir,
      env: { ...process.env },
      stderr: 'pipe',
      stdout: 'pipe',
    })
  }

  test('migrates all notes to snowflake ids and rewrites parent references', () => {
    const notesPath = join(tmpDir, 'notes.json')

    writeFileSync(
      notesPath,
      JSON.stringify(
        [
          {
            id: 'legacy-root',
            body: {
              ja: 'root note',
            },
            createdAt: '2026-03-25T12:10:10.284Z',
            published: true,
          },
          {
            body: {
              ja: 'reply note',
            },
            createdAt: '2026-03-25T12:10:10.284Z',
            parentId: 'legacy-root',
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
      parentId?: string
      body: { ja: string; en: string }
      createdAt: string
    }>

    expect(migrated).toHaveLength(2)
    expect(migrated[0]?.id).toMatch(/^\d+$/)
    expect(migrated[1]?.id).toMatch(/^\d+$/)
    expect(migrated[0]?.id).not.toBe('legacy-root')
    expect(migrated[1]?.id).not.toBe('2026-03-25T12:10:10.284Z')
    expect(migrated[1]?.parentId).toBe(migrated[0]?.id)
    expect(migrated[1]?.body.en).toBe('')
  })
})
