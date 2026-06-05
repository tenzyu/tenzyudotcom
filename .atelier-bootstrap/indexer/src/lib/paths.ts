/**
 * Paths used by the indexer.
 *
 * Re-exports the shared INDEXER_PATHS so commands can `import` from
 * a single place.
 */
export { INDEXER_PATHS as INDEXER_OUTPUT, INDEXER_PATHS } from '../../../lib/src/paths.ts'
export { ATELIER_IGNORED_DIRS as INDEXER_IGNORED_DIRS } from '../../../lib/src/paths.ts'

export const INDEXER_IGNORED_FILES = new Set<string>([
  '.DS_Store',
  'bun.lock',
  'flake.lock',
  'Cargo.lock',
])
