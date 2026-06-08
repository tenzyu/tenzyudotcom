/**
 * Atelier Autopoiesis — NDJSON read/write helpers.
 *
 * The autopoiesis component reuses the generic `readNdjson` /
 * `parseNdjsonText` / `stringifyNdjson` primitives from
 * `.atelier-bootstrap/lib/src/ndjson.ts` and adds two thin wrappers
 * specific to the autopoiesis workflow:
 *
 *   - `readNdjsonAutopoiesis<T>(filePath)`: returns `[]` when the
 *     file does not exist; otherwise parses every JSONL line.
 *
 *   - `appendNdjsonAutopoiesis<T>(filePath, row)`: appends a single
 *     JSONL line under an in-process per-file mutex. The append
 *     pattern is: read existing content, write the new line to a
 *     temp file in the same directory, then `rename()` the temp
 *     file to the target. The `rename()` step is atomic on POSIX
 *     (and best-effort on Windows).
 *
 * Concurrency contract:
 *   - In-process safety: the module-level `appendLocks` map serializes
 *     appends to the same `filePath` for callers in the same process.
 *     Two concurrent `appendNdjsonAutopoiesis(target, …)` calls in
 *     the same process are guaranteed to be applied in the order
 *     their callers awaited the function.
 *   - Cross-process safety: still relies on the atomicity of
 *     `rename(2)` on POSIX. Two writers in different processes can
 *     still lose data if they both read the same prefix and both
 *     rename a tmp file to the target. Cross-process coordination
 *     is the caller's responsibility (e.g. a separate lockfile or
 *     a single-writer command). The module documents this
 *     limitation rather than overpromising.
 */
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseNdjsonText, parseNdjsonTextTolerant, stringifyNdjson } from '../../../lib/src/ndjson.ts'

/**
 * Read every record from an autopoiesis NDJSON file. Returns an
 * empty array when the file does not exist.
 */
export async function readNdjsonAutopoiesis<T = unknown>(filePath: string): Promise<T[]> {
  let text: string
  try {
    text = await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw err
  }
  return parseNdjsonText<T>(text)
}

/**
 * Tolerant reader. Returns both the successfully parsed records
 * AND a list of per-line `NdjsonLineError` entries (line number
 * is 1-indexed). The function never throws on a single corrupt
 * line; only an irrecoverable filesystem error propagates.
 *
 * Use this when reading append-only ledgers where a stray bad
 * line must not abort the rest of the read. The strict
 * `readNdjsonAutopoiesis` is the default; opt into tolerance via
 * this function.
 */
export async function readNdjsonAutopoiesisTolerant<T = unknown>(
  filePath: string,
): Promise<{ records: T[]; lineErrors: { line: number; message: string }[] }> {
  let text: string
  try {
    text = await readFile(filePath, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { records: [], lineErrors: [] }
    throw err
  }
  return parseNdjsonTextTolerant<T>(text)
}

/* -------------------------------------------------------------------------- */
/*                       In-process per-file append mutex                     */
/* -------------------------------------------------------------------------- */

/**
 * Map from absolute file path → tail of the in-process append chain.
 * Each new append chains its body onto the previous promise for the
 * same path so that the read-modify-write inside the body is observed
 * by the next caller.
 *
 * This mutex is in-process only; it does NOT coordinate writers
 * across separate processes. Cross-process safety still relies on
 * the atomic `rename()` step in the body.
 */
const appendLocks = new Map<string, Promise<unknown>>()

/**
 * Acquire the in-process mutex for `filePath`, run `body`, and
 * release the mutex. The returned promise resolves with the result
 * of `body`. Subsequent calls for the same `filePath` await the
 * returned promise, so the body of two concurrent callers is
 * strictly serialized in the order they acquired the mutex.
 */
async function withAppendLock<T>(filePath: string, body: () => Promise<T>): Promise<T> {
  const prev = appendLocks.get(filePath) ?? Promise.resolve()
  // The next-in-chain promise is what the NEXT caller will await.
  // We deliberately do not depend on the success of `prev`: a
  // previous failure must not poison the chain, so we attach a
  // `.catch(() => undefined)` to the chain link we publish. The
  // caller's own try/catch still propagates their error.
  const run = (): Promise<T> => body()
  const next: Promise<unknown> = prev.catch(() => undefined).then(run, run)
  appendLocks.set(filePath, next)
  try {
    return (await next) as T
  } finally {
    // Only delete the map entry when no newer caller has chained
    // onto us (i.e. we are still the tail). If a newer caller
    // already chained, leave the entry in place so the newer
    // caller's promise is the one to wait on.
    if (appendLocks.get(filePath) === next) {
      appendLocks.delete(filePath)
    }
  }
}

/**
 * Append a single record to an autopoiesis NDJSON file. Wraps the
 * read-modify-write body in an in-process per-file mutex so two
 * concurrent callers in the same process do not lose each other's
 * writes. Cross-process safety is best-effort and depends on the
 * atomicity of `rename(2)` on POSIX.
 */
export async function appendNdjsonAutopoiesis<T>(filePath: string, row: T): Promise<void> {
  await withAppendLock(filePath, async () => {
    await mkdir(path.dirname(filePath), { recursive: true })
    const line = JSON.stringify(row) + '\n'
    let existing = ''
    try {
      existing = await readFile(filePath, 'utf8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err
    }
    const tmp = `${filePath}.tmp.${process.pid}.${Date.now()}.${Math.random()
      .toString(36)
      .slice(2, 8)}`
    await writeFile(tmp, existing + line, 'utf8')
    await rename(tmp, filePath)
  })
}

/**
 * Rewrite an autopoiesis NDJSON file in full. Uses the same
 * `stringifyNdjson` JSONL-safe writer as the rest of the atelier
 * tooling. Intended for test fixtures and the validator when it
 * needs to normalise state.
 */
export async function writeNdjsonAutopoiesis<T>(
  filePath: string,
  rows: ReadonlyArray<T>,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, stringifyNdjson(rows), 'utf8')
}

export { stringifyNdjson, parseNdjsonText, parseNdjsonTextTolerant }
