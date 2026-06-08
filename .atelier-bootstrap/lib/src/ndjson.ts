import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import path from 'node:path'

/**
 * Read a NDJSON file as a stream of JSON objects.
 *
 * Blank lines and lines starting with `#` are ignored to allow comments.
 * Throws a helpful error if any non-blank line fails to parse.
 */
export async function readNdjson<T = unknown>(filePath: string): Promise<T[]> {
  let text: string
  try {
    text = await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
  return parseNdjsonText(text)
}

export function parseNdjsonText<T = unknown>(text: string): T[] {
  const out: T[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    try {
      out.push(JSON.parse(trimmed) as T)
    } catch (err) {
      throw new Error(
        `Invalid NDJSON at line ${i + 1} of ${'<input>'}: ${(err as Error).message}\n  -> ${trimmed.slice(0, 120)}`,
      )
    }
  }
  return out
}

/**
 * Tolerant variant of `parseNdjsonText`. Never throws; instead
 * collects per-line `ParseError` records describing which lines
 * failed to parse. Blank lines and comment lines (`#`-prefixed)
 * are ignored without error.
 *
 * Use this when reading log-like or append-only data where a
 * single corrupt line must not abort the whole read. The strict
 * variant is the default; opt into tolerance explicitly.
 */
export type NdjsonLineError = { line: number; message: string; preview: string }

export function parseNdjsonTextTolerant<T = unknown>(
  text: string,
): { records: T[]; lineErrors: NdjsonLineError[] } {
  const records: T[] = []
  const lineErrors: NdjsonLineError[] = []
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) continue
    try {
      records.push(JSON.parse(trimmed) as T)
    } catch (err) {
      lineErrors.push({
        line: i + 1,
        message: (err as Error).message,
        preview: trimmed.slice(0, 120),
      })
    }
  }
  return { records, lineErrors }
}

/**
 * Serialize a list of objects as NDJSON.
 *
 * Trailing newline is included so the file is friendly to stream consumers.
 */
export function stringifyNdjson<T>(rows: ReadonlyArray<T>): string {
  if (rows.length === 0) return ''
  return rows.map((row) => JSON.stringify(row)).join('\n') + '\n'
}

export async function writeNdjson<T>(filePath: string, rows: ReadonlyArray<T>): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, stringifyNdjson(rows), 'utf8')
}

/**
 * Append a single NDJSON line to a file. Creates the file (and parent dirs)
 * if it does not exist.
 */
export async function appendNdjson<T>(filePath: string, row: T): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  const exists = await fileExists(filePath)
  const prefix = exists ? '' : ''
  await writeFile(filePath, prefix + JSON.stringify(row) + '\n', { flag: 'a' })
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath)
    return true
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw err
  }
}
