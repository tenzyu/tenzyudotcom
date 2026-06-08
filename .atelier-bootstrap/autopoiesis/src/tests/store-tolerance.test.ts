/**
 * Atelier Autopoiesis — store tolerance tests.
 *
 * Two negative controls for the tolerant NDJSON reader:
 *
 *   1. A file with a single corrupt line emits a
 *      `lineErrors` entry with the correct 1-indexed line
 *      number, and the reader does NOT throw.
 *   2. A file with all valid lines emits `lineErrors=[]`.
 *
 * Plus a positive control: a missing file yields `{records: [],
 * lineErrors: []}` without throwing.
 */
import { describe, test, expect, beforeAll, afterAll } from 'bun:test'
import path from 'node:path'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'

import { readNdjsonAutopoiesisTolerant } from '../lib/store.ts'
import { parseNdjsonTextTolerant } from '../../../lib/src/ndjson.ts'

/* -------------------------------------------------------------------------- */
/*                               Fixture setup                                */
/* -------------------------------------------------------------------------- */

let FIXTURE_ROOT: string
let SAMPLE_FILE: string

beforeAll(async () => {
  FIXTURE_ROOT = await mkdtemp(path.join(tmpdir(), 'atelier-tolerance-'))
  SAMPLE_FILE = path.join(FIXTURE_ROOT, 'sample.ndjson')
  await mkdir(FIXTURE_ROOT, { recursive: true })
})

afterAll(async () => {
  await rm(FIXTURE_ROOT, { recursive: true, force: true })
})

/* -------------------------------------------------------------------------- */
/*                            Tests                                            */
/* -------------------------------------------------------------------------- */

describe('parseNdjsonTextTolerant', () => {
  test('fully valid file → records=2, lineErrors=[]', () => {
    const text =
      JSON.stringify({ id: 'a', n: 1 }) +
      '\n' +
      JSON.stringify({ id: 'b', n: 2 }) +
      '\n'
    const { records, lineErrors } = parseNdjsonTextTolerant<{ id: string; n: number }>(text)
    expect(records.length).toBe(2)
    expect(records[0]?.id).toBe('a')
    expect(records[1]?.id).toBe('b')
    expect(lineErrors).toEqual([])
  })

  test('single corrupt line → records=[valid], lineErrors[0].line=corrupt line', () => {
    const text =
      JSON.stringify({ id: 'a', n: 1 }) +
      '\n' +
      '{this is not json' +
      '\n' +
      JSON.stringify({ id: 'b', n: 2 }) +
      '\n'
    const { records, lineErrors } = parseNdjsonTextTolerant<{ id: string; n: number }>(text)
    expect(records.length).toBe(2)
    expect(records.map((r) => r.id)).toEqual(['a', 'b'])
    expect(lineErrors.length).toBe(1)
    expect(lineErrors[0]?.line).toBe(2)
    expect(typeof lineErrors[0]?.message).toBe('string')
  })

  test('empty file → records=[], lineErrors=[]', () => {
    const { records, lineErrors } = parseNdjsonTextTolerant('')
    expect(records).toEqual([])
    expect(lineErrors).toEqual([])
  })

  test('blank lines and comment lines are ignored without error', () => {
    const text =
      '' +
      '\n' +
      '# a comment line\n' +
      JSON.stringify({ id: 'a' }) +
      '\n' +
      '   \n' +
      JSON.stringify({ id: 'b' }) +
      '\n'
    const { records, lineErrors } = parseNdjsonTextTolerant<{ id: string }>(text)
    expect(records.length).toBe(2)
    expect(lineErrors).toEqual([])
  })
})

describe('readNdjsonAutopoiesisTolerant', () => {
  test('missing file → records=[], lineErrors=[] (no throw)', async () => {
    const missing = path.join(FIXTURE_ROOT, 'does-not-exist.ndjson')
    const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<{ id: string }>(missing)
    expect(records).toEqual([])
    expect(lineErrors).toEqual([])
  })

  test('corrupt line in file → lineErrors[0] carries the correct line number', async () => {
    const corrupt = JSON.stringify({ id: 'a' }) + '\n' + 'garbage line\n' + JSON.stringify({ id: 'b' }) + '\n'
    await writeFile(SAMPLE_FILE, corrupt, 'utf8')
    const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<{ id: string }>(SAMPLE_FILE)
    expect(records.length).toBe(2)
    expect(records.map((r) => r.id)).toEqual(['a', 'b'])
    expect(lineErrors.length).toBe(1)
    expect(lineErrors[0]?.line).toBe(2)
  })

  test('all-valid file → lineErrors=[]', async () => {
    const valid =
      JSON.stringify({ id: 'x', n: 1 }) +
      '\n' +
      JSON.stringify({ id: 'y', n: 2 }) +
      '\n'
    await writeFile(SAMPLE_FILE, valid, 'utf8')
    const { records, lineErrors } = await readNdjsonAutopoiesisTolerant<{ id: string; n: number }>(
      SAMPLE_FILE,
    )
    expect(records.length).toBe(2)
    expect(lineErrors).toEqual([])
  })
})
