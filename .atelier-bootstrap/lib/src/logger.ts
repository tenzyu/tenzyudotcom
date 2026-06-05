/**
 * A tiny stderr logger for `atelier-*` CLIs.
 *
 * Atelier tools run as `bun ...` invocations from a parent shell.
 * Stdout is reserved for primary results (NDJSON, ID, or short report).
 * Stderr is reserved for progress and warnings.
 *
 * The logger is intentionally simple; it does not allocate a logger object,
 * it does not depend on a third-party package, and it is safe to call
 * concurrently from a single command invocation.
 */

export type Logger = {
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
  debug: (message: string) => void
}

function write(level: string, message: string): void {
  process.stderr.write(`[atelier:${level}] ${message}\n`)
}

export function createLogger(component: string): Logger {
  void component // reserved for future use
  return {
    info: (message) => write('info', message),
    warn: (message) => write('warn', message),
    error: (message) => write('error', message),
    debug: (message) => {
      if (process.env['ATELIER_DEBUG'] === '1') write('debug', message)
    },
  }
}
