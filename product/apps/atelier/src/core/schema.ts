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

export type ArtifactKind =
  | 'markdown'
  | 'knowledge'
  | 'check'
  | 'skill'
  | 'linter'
  | 'role'
  | 'task'
  | 'permission'
  | 'hook'
  | 'agent'
  | 'team'
  | 'run'
  | 'trace'
  | 'source-file'
  | 'generated-file'
  | 'decision'
  | 'product-intent'
  | 'control-mechanism'

export type EdgeKind =
  | 'derives_from'
  | 'implements'
  | 'satisfies'
  | 'guards'
  | 'validates'
  | 'selects'
  | 'scopes'
  | 'supersedes'
  | 'conflicts_with'
  | 'observed_from'
  | 'emitted_as'
  | 'edited_by'

export type OwnershipMode = 'observed' | 'generated' | 'managed' | 'curated' | 'external' | 'deprecated'

export type ArtifactStatus = 'active' | 'stale' | 'orphaned' | 'deprecated' | 'archived'

export type Artifact = {
  id: string
  kind: ArtifactKind
  path: string
  contentHash: string
  metadata: Record<string, unknown>
  ownership: OwnershipMode
  status: ArtifactStatus
}

export type Edge = {
  from: string
  to: string
  kind: EdgeKind
  confidence: 'high' | 'medium' | 'low'
  source: string
}

export type GraphSnapshot = {
  version: 1
  generatedAt: string
  artifacts: Artifact[]
  edges: Edge[]
}

export type ScanResult = {
  graph: GraphSnapshot
  observed: number
  errors: string[]
}

export type GraphStatus = {
  artifactCount: number
  edgeCount: number
  kindCounts: Record<string, number>
  staleArtifacts: Artifact[]
  orphanedArtifacts: Artifact[]
  unresolvedCount: number
}

export type HarnessStatus = 'draft' | 'active' | 'deprecated' | 'archived'

export type Strictness = 'strict' | 'indexed' | 'loose'

export type DiagnosticSeverity = 'error' | 'warning' | 'info'

export type EventKind =
  | 'file_changed'
  | 'file_moved'
  | 'file_deleted'
  | 'artifact_observed'
  | 'artifact_edited'
  | 'artifact_deleted'
  | 'artifact_emitted'
  | 'run_started'
  | 'run_completed'
  | 'rule_changed'
  | 'policy_decision'
  | 'reconciliation_finding'

export type RiskAction = 'silent' | 'auto-reconcile' | 'advisory' | 'task' | 'human-decision' | 'block'

export type AtelierEvent = {
  id: string
  timestamp: string
  kind: EventKind
  payload: Record<string, unknown>
  source: string
}

export type ReconciliationFinding = {
  kind: 'orphan-source' | 'missing-control' | 'moved-artifact' | 'deleted-artifact' | 'policy-violation' | 'curated-edit'
  riskAction: RiskAction
  artifactId: string
  artifactPath: string
  message: string
  details?: Record<string, unknown>
}

export type ControlType =
  | 'check'
  | 'linter'
  | 'typecheck'
  | 'test'
  | 'hook'
  | 'permission'
  | 'generator'
  | 'codemod'
  | 'template'
  | 'runtime-guard'
  | 'review-rule'
  | 'context-selector'
  | 'ci-gate'
  | 'ui-constraint'

export type ControlOwnershipMode = 'observed' | 'generated' | 'curated' | 'inferred'

export type ControlProvenance = 'generated-check' | 'eslint' | 'biome' | 'prettier' | 'nx-target' | 'package-script' | 'ci-file' | 'hook-script' | 'policy-file' | 'test-file' | 'selector' | 'manifest' | 'template-file' | 'runner-config'

export type ControlMechanism = {
  id: string
  type: ControlType
  name: string
  path: string
  ownership: ControlOwnershipMode
  provenance: ControlProvenance
  targets: string[]
  targetIntents: string[]
  metadata: Record<string, unknown>
}

export type ControlCoverageEntry = {
  knowledgeId: string
  knowledgePath: string
  controls: ControlMechanism[]
  missingTypes: ControlType[]
  coverageScore: number
}

export type ControlCoverageReport = {
  totalKnowledge: number
  coveredKnowledge: number
  uncoveredKnowledge: number
  totalControls: number
  orphanedControls: ControlMechanism[]
  entries: ControlCoverageEntry[]
  typeCounts: Record<string, number>
}

export type SelectorV2Input = {
  projectRoot?: string
  workflowId: string
  roleIds: string[]
  inputPath: string
  intent: string
  requiredOnly?: boolean
  mode?: 'compact' | 'full' | 'linked'
  semantic?: boolean
  semanticMaxResults?: number
  selectorV2?: boolean
}

export type SelectorV2Trace = {
  type: 'role' | 'task' | 'phase' | 'scope' | 'diff' | 'risk' | 'permission' | 'budget'
  decision: string
  reason: string
  sourceArtifacts: string[]
}

export type PermissionEnvelope = {
  roleId: string
  ownershipModes: string[]
  allowedKinds: string[]
  allowedPaths: string[]
  sourceCount: number
}

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
  |   'EMPTY_KNOWLEDGE_CARD'
  | 'STALE_ARTIFACT'
  | 'ORPHAN_ARTIFACT'

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
