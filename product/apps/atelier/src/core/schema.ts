export type HarnessKind =
  | 'knowledge'
  | 'role'
  | 'workflow'
  | 'phase'
  | 'policy'
  | 'artifact-template'
  | 'knowledge-proposal'
  | 'run'
  | 'observation'
  | 'adapter'
  | 'canon'

export type HarnessStatus = 'draft' | 'active' | 'deprecated' | 'archived'

export type Strictness = 'strict' | 'indexed' | 'loose'

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export type DiagnosticCode =
  | 'DUPLICATE_ID'
  | 'MISSING_ID'
  | 'INVALID_FRONTMATTER'
  | 'UNKNOWN_KIND'
  | 'BROKEN_MARKDOWN_LINK'
  | 'UNRESOLVED_ID_REFERENCE'
  | 'OLD_HARNESS_AI_ORG_REFERENCE'
  | 'STALE_GENERATED_INDEX'
  | 'MISSING_ROLE'
  | 'MISSING_WORKFLOW'
  | 'MISSING_PHASE'
  | 'ORPHAN_KNOWLEDGE'
  | 'ROLE_SELECTOR_EMPTY'
  | 'ROLE_SELECTOR_TOO_BROAD'
  | 'CONTEXT_BUDGET_EXCEEDED'
  | 'MISSING_RUN_ARTIFACT'
  | 'CONTEXT_HASH_MISMATCH'
  | 'RUN_REVIEW_REQUIRED'
  | 'RUN_SKIPPED_CHECK_UNJUSTIFIED'
  | 'RUN_KNOWLEDGE_PROPOSAL_OPEN'
  | 'INVALID_KNOWLEDGE_PROPOSAL'
  | 'DUPLICATE_KNOWLEDGE_CANDIDATE'
  | 'RUN_FRONTMATTER_IN_COMPLETED'
  | 'DISALLOWED_FRONTMATTER_FIELD'
  | 'NON_ARRAY_TAGS'
  | 'ROLE_ROUTING_MISSING'
  | 'KNOWLEDGE_ROLE_REFERENCE'
  | 'PATTERN_REQUIRES_RELATIONS'
  | 'PATTERN_REQUIRES_CONDITIONS'
  | 'MISSING_AFFORDANCES'
  | 'INVALID_TAG_FORMAT'
  | 'ID_NAMESPACE_MISMATCH'
  | 'CRITICALITY_UNCOVERED'
  | 'EMPTY_KNOWLEDGE_CARD'

export type HarnessFrontmatter = {
  schema?: unknown
  kind?: unknown
  id?: unknown
  title?: unknown
  status?: unknown
  summary?: unknown
  tags?: unknown
  supersedes?: unknown
  superseded_by?: unknown
  phases?: unknown
  conditional_phases?: unknown
  pinned?: unknown
  selectors?: unknown
  role_type?: unknown
  knowledge_type?: unknown
  callable?: unknown
  scope?: unknown
  read_when?: unknown
  skip_when?: unknown
  x?: unknown
  [key: string]: unknown
}

export type HarnessDocument = {
  absolutePath: string
  relativePath: string
  body: string
  raw: string
  frontmatter: HarnessFrontmatter | null
  frontmatterRaw: string | null
  sha256: string
  headings: string[]
  links: MarkdownLink[]
  strictness: Strictness
  frontmatterError?: string
}

export type MarkdownLink = {
  target: string
  line: number
}

export type Diagnostic = {
  code: DiagnosticCode
  severity: DiagnosticSeverity
  message: string
  path?: string
  line?: number
  details?: Record<string, unknown>
}

export type DoctorSummary = {
  ok: boolean
  documentCount: number
  errorCount: number
  warningCount: number
  infoCount: number
}

export type DoctorReport = {
  summary: DoctorSummary
  diagnostics: Diagnostic[]
}

const KNOWN_KINDS = new Set<HarnessKind>([
  'knowledge',
  'role',
  'workflow',
  'phase',
  'policy',
  'artifact-template',
  'knowledge-proposal',
  'run',
  'observation',
  'adapter',
  'canon',
])

export function isKnownKind(value: unknown): value is HarnessKind {
  return typeof value === 'string' && KNOWN_KINDS.has(value as HarnessKind)
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export function diagnosticSeverityRank(severity: DiagnosticSeverity) {
  if (severity === 'error') return 0
  if (severity === 'warning') return 1
  return 2
}
