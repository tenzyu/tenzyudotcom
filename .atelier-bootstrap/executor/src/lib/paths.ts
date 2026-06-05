/**
 * Executor-specific paths (re-exports the shared EXECUTOR_PATHS).
 */
export { EXECUTOR_PATHS as EXECUTOR_OUTPUT, EXECUTOR_PATHS } from '../../../lib/src/paths.ts'

/** Path to the packets NDJSON registry. */
import path from 'node:path'
import { EXECUTOR_PATHS } from '../../../lib/src/paths.ts'
export const PACKETS_REGISTRY = path.join(EXECUTOR_PATHS.handoffsDir, 'packets.ndjson')
