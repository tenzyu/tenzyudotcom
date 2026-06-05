/**
 * Process context helpers.
 *
 * These helpers let commands and tests run from any directory by
 * resolving the project root from `process.cwd()` (or an explicit
 * `--cwd` flag) instead of relying on captured-at-import-time
 * constants.
 *
 * The helpers centralise the `process.chdir` and `ATELIER_ROOT`
 * conventions.
 */
import path from 'node:path'

/**
 * Read the project root from the environment, an explicit override,
 * or `process.cwd()`.
 */
export function readProjectRoot(override?: string): string {
  if (override) return path.resolve(override)
  if (process.env['ATELIER_ROOT']) return path.resolve(process.env['ATELIER_ROOT'])
  return path.resolve(process.cwd())
}

/**
 * Read a flag value from an argv-style list. The flag may be passed as
 * `--name value` or `--name=value`. Returns `undefined` when missing.
 */
export function readFlag(args: readonly string[], name: string): string | undefined {
  const withEq = args.find((a) => a.startsWith(`${name}=`))
  if (withEq) return withEq.slice(name.length + 1)
  const idx = args.indexOf(name)
  if (idx === -1) return undefined
  return args[idx + 1]
}

/**
 * Read a list flag, accepting `--name value` repeated, `--name=value`
 * repeated, or space-separated. Returns an empty array when missing.
 */
export function readFlagList(args: readonly string[], name: string): string[] {
  const out: string[] = []
  for (const a of args) {
    if (a.startsWith(`${name}=`)) out.push(a.slice(name.length + 1))
  }
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && i + 1 < args.length) {
      out.push(args[i + 1]!)
      i += 1
    }
  }
  return out
}

/**
 * Resolve the `.atelier-bootstrap/` root for the current command.
 * Honors `ATELIER_BOOTSTRAP_ROOT` and the explicit override.
 */
export function bootstrapRoot(override?: string): string {
  if (process.env['ATELIER_BOOTSTRAP_ROOT']) {
    return path.resolve(process.env['ATELIER_BOOTSTRAP_ROOT'])
  }
  return path.join(readProjectRoot(override), '.atelier-bootstrap')
}
