/**
 * Tiny result helpers used by every `atelier-*` command.
 *
 * A command either succeeds (exit 0) or fails (exit 1) with a structured
 * error report. The report is emitted to stdout as JSON so the parent
 * process (or the operational review) can machine-parse the result.
 */

export type AtelierResultStatus = 'pass' | 'fail' | 'partial' | 'blocked'

export type AtelierIssue = {
  severity: 'P0' | 'P1' | 'P2'
  code: string
  message: string
  affected_record?: string
  recommended_next_action?: string
}

export type AtelierResult<T = unknown> = {
  schema: 'atelier.command-result/v1'
  status: AtelierResultStatus
  component: string
  command: string
  started_at: string
  finished_at: string
  duration_ms: number
  data: T
  issues: AtelierIssue[]
  warnings: string[]
}

export function ok<T>(
  component: string,
  command: string,
  data: T,
  opts: { warnings?: string[]; startedAt?: string; finishedAt?: string } = {},
): AtelierResult<T> {
  const startedAt = opts.startedAt ?? new Date().toISOString()
  const finishedAt = opts.finishedAt ?? new Date().toISOString()
  return {
    schema: 'atelier.command-result/v1',
    status: 'pass',
    component,
    command,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
    data,
    issues: [],
    warnings: opts.warnings ?? [],
  }
}

export function fail<T = unknown>(
  component: string,
  command: string,
  issues: ReadonlyArray<AtelierIssue>,
  data: T = {} as T,
  opts: { warnings?: string[]; status?: 'fail' | 'blocked' | 'partial'; startedAt?: string; finishedAt?: string } = {},
): AtelierResult<T> {
  const startedAt = opts.startedAt ?? new Date().toISOString()
  const finishedAt = opts.finishedAt ?? new Date().toISOString()
  return {
    schema: 'atelier.command-result/v1',
    status: opts.status ?? 'fail',
    component,
    command,
    started_at: startedAt,
    finished_at: finishedAt,
    duration_ms: Date.parse(finishedAt) - Date.parse(startedAt),
    data,
    issues: [...issues],
    warnings: opts.warnings ?? [],
  }
}

export function printResult<T>(result: AtelierResult<T>): void {
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')
}

export function exitCode(result: AtelierResult): 0 | 1 {
  return result.status === 'pass' ? 0 : 1
}
