import type { AtelierProvenance, AtelierConfidence, SourceRef } from '../../../lib/src/types.ts'

/**
 * Compile-time schema declarations for indexer-emitted records.
 *
 * These are not runtime validators. Runtime validation lives in
 * `src/lib/validate.ts` and re-checks every record before it is
 * considered valid.
 */

export type IndexerObjectKind = 'source_unit' | 'source_fact' | 'source_edge'

export type IndexerProvenance = Extract<AtelierProvenance, 'deterministic_fact'>

export type IndexerConfidence = Extract<AtelierConfidence, 'fact'>

export const INDEXER_PRODUCER = 'indexer' as const
export const INDEXER_PROVENANCE: IndexerProvenance = 'deterministic_fact'
export const INDEXER_CONFIDENCE: IndexerConfidence = 'fact'

export const SOURCE_FACT_TYPES = [
  'file_exists',
  'package_manager',
  'script_exists',
  'test_framework_candidate',
  'docs_path',
  'workspace_config',
  'git_status',
  'extension_histogram',
  'naming_pattern',
  'file_size',
  'directory_exists',
] as const

export const SOURCE_UNIT_TYPES = [
  'file',
  'markdown_section',
  'symbol_candidate',
  'test_file',
  'config_file',
  'package_script',
  'docs_file',
] as const

export const EDGE_KINDS = [
  'contains',
  'defines',
  'references',
  'depends_on',
  'supports',
  'constrains',
  'transforms_to',
  'verifies',
  'satisfies',
  'invalidates',
] as const

export type SourceRefWithoutHash = Omit<SourceRef, 'sha256'>
