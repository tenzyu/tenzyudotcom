import path from 'node:path'

/**
 * The output root for all generated Atelier v0 artifacts.
 *
 * Tooling lives in `.atelier-bootstrap/**`.
 * Generated output lives in `.atelier/v0/**`.
 *
 * These two trees must not be mixed.
 *
 * The root is computed dynamically so the test harness can change
 * `process.cwd()` between tests. Callers should call `atelierV0Root()`
 * to get the current value.
 */
export function atelierV0Root(): string {
  return path.resolve(process.cwd(), '.atelier', 'v0')
}

export function atelierBootstrapRoot(): string {
  return path.resolve(process.cwd(), '.atelier-bootstrap')
}

export function atelierV0Paths(): {
  facts: string
  objects: string
  edges: string
  indexes: string
  briefs: string
  transforms: string
  runs: string
  views: string
  operation: string
} {
  const root = atelierV0Root()
  return {
    facts: path.join(root, 'facts'),
    objects: path.join(root, 'objects'),
    edges: path.join(root, 'edges'),
    indexes: path.join(root, 'indexes'),
    briefs: path.join(root, 'briefs'),
    transforms: path.join(root, 'transforms'),
    runs: path.join(root, 'runs'),
    views: path.join(root, 'views'),
    operation: path.join(root, 'operation'),
  }
}

/**
 * Convenience constant. The values are evaluated at module load time.
 * If the test harness changes `process.cwd()`, callers should re-import
 * the lib module or use the function form `atelierV0Paths()`.
 */
export const ATELIER_V0_ROOT = atelierV0Root()
export const ATELIER_V0 = atelierV0Paths()
export const ATELIER_V0_SUBDIRS: ReadonlyArray<string> = (() => {
  const v = ATELIER_V0
  return [
    v.facts,
    v.objects,
    v.edges,
    v.indexes,
    v.briefs,
    v.transforms,
    v.runs,
    v.views,
    v.operation,
    path.join(v.runs, 'evidence'),
    path.join(v.runs, 'handoffs'),
    path.join(v.runs, 'blockers'),
    path.join(v.transforms, 'md-to-code'),
    path.join(v.views, 'index'),
    path.join(v.views, 'objects'),
    path.join(v.views, 'runs'),
  ] as const
})()

export type AtelierSubdir = keyof typeof ATELIER_V0

export const ATELIER_BOOTSTRAP_ROOT = atelierBootstrapRoot()

export const ATELIER_BOOTSTRAP = {
  indexer: path.join(ATELIER_BOOTSTRAP_ROOT, 'indexer'),
  reader: path.join(ATELIER_BOOTSTRAP_ROOT, 'reader'),
  transformer: path.join(ATELIER_BOOTSTRAP_ROOT, 'transformer'),
  executor: path.join(ATELIER_BOOTSTRAP_ROOT, 'executor'),
  operation: path.join(ATELIER_BOOTSTRAP_ROOT, 'operation'),
  lib: path.join(ATELIER_BOOTSTRAP_ROOT, 'lib'),
  tests: path.join(ATELIER_BOOTSTRAP_ROOT, 'tests'),
} as const

/**
 * Indexer output paths. Shared with other components.
 */
type IndexerPathMap = {
  factsRepo: string
  factsPackage: string
  factsScripts: string
  factsWorkspace: string
  factsGit: string
  factsFiles: string
  factsExtensions: string
  objectsSource: string
  objectsFacts: string
  edges: string
  indexByPath: string
  indexByKind: string
  indexByHash: string
  indexByObject: string
  indexStale: string
  viewIndexSummary: string
  viewSourceUnits: string
  viewAffected: string
}

function buildIndexerPaths(): IndexerPathMap {
  const v = atelierV0Paths()
  return {
    factsRepo: path.join(v.facts, 'repo.json'),
    factsPackage: path.join(v.facts, 'package.json'),
    factsScripts: path.join(v.facts, 'scripts.json'),
    factsWorkspace: path.join(v.facts, 'workspace.json'),
    factsGit: path.join(v.facts, 'git.json'),
    factsFiles: path.join(v.facts, 'files.ndjson'),
    factsExtensions: path.join(v.facts, 'extensions.json'),
    objectsSource: path.join(v.objects, 'source.ndjson'),
    objectsFacts: path.join(v.objects, 'facts.ndjson'),
    edges: path.join(v.edges, 'edges.ndjson'),
    indexByPath: path.join(v.indexes, 'by-path.json'),
    indexByKind: path.join(v.indexes, 'by-kind.json'),
    indexByHash: path.join(v.indexes, 'by-hash.json'),
    indexByObject: path.join(v.indexes, 'by-object.json'),
    indexStale: path.join(v.indexes, 'stale.json'),
    viewIndexSummary: path.join(v.views, 'index', 'INDEX_SUMMARY.md'),
    viewSourceUnits: path.join(v.views, 'index', 'SOURCE_UNITS.md'),
    viewAffected: path.join(v.views, 'index', 'AFFECTED.md'),
  }
}

export const INDEXER_PATHS: IndexerPathMap = buildIndexerPaths()

type ReaderPathMap = {
  projectBrief: string
  hypotheses: string
  knowledge: string
  semantics: string
  attention: string
  projectBriefView: string
  attentionView: string
  knowledgeView: string
  llmJobsDir: string
  proposalsDir: string
}

function buildReaderPaths(): ReaderPathMap {
  const v = atelierV0Paths()
  return {
    projectBrief: path.join(v.briefs, 'project-brief.yaml'),
    hypotheses: path.join(v.briefs, 'hypotheses.ndjson'),
    knowledge: path.join(v.objects, 'knowledge.ndjson'),
    semantics: path.join(v.objects, 'semantics.ndjson'),
    attention: path.join(v.objects, 'attention.ndjson'),
    projectBriefView: path.join(v.views, 'objects', 'PROJECT_BRIEF.md'),
    attentionView: path.join(v.views, 'objects', 'ATTENTION_SETS.md'),
    knowledgeView: path.join(v.views, 'objects', 'KNOWLEDGE_OBJECTS.md'),
    llmJobsDir: path.join(v.briefs, 'llm-jobs'),
    proposalsDir: path.join(v.briefs, 'proposals'),
  }
}

export const READER_PATHS: ReaderPathMap = buildReaderPaths()

type TransformerPathMap = {
  root: string
  implementationTasks: string
  testContracts: string
  editBoundaries: string
  packetTemplates: string
  recommendations: string
  packetsDir: string
  viewImplementationTasks: string
  viewTestContracts: string
  viewTransformRecommendations: string
}

function buildTransformerPaths(): TransformerPathMap {
  const v = atelierV0Paths()
  return {
    root: path.join(v.transforms, 'md-to-code'),
    implementationTasks: path.join(v.transforms, 'md-to-code', 'model', 'implementation-tasks.ndjson'),
    testContracts: path.join(v.transforms, 'md-to-code', 'model', 'test-contracts.ndjson'),
    editBoundaries: path.join(v.transforms, 'md-to-code', 'model', 'edit-boundaries.ndjson'),
    packetTemplates: path.join(v.transforms, 'md-to-code', 'model', 'packet-templates.ndjson'),
    recommendations: path.join(v.transforms, 'md-to-code', 'model', 'recommendations.ndjson'),
    packetsDir: path.join(v.transforms, 'md-to-code', 'packets'),
    viewImplementationTasks: path.join(v.transforms, 'md-to-code', 'views', 'IMPLEMENTATION_TASKS.md'),
    viewTestContracts: path.join(v.transforms, 'md-to-code', 'views', 'TEST_CONTRACTS.md'),
    viewTransformRecommendations: path.join(v.transforms, 'md-to-code', 'views', 'TRANSFORM_RECOMMENDATIONS.md'),
  }
}

export const TRANSFORMER_PATHS: TransformerPathMap = buildTransformerPaths()

type ExecutorPathMap = {
  ledger: string
  evidenceDir: string
  handoffsDir: string
  blockersDir: string
  viewExecutionFrontier: string
  viewEvidenceLedger: string
  viewBlockers: string
}

function buildExecutorPaths(): ExecutorPathMap {
  const v = atelierV0Paths()
  return {
    ledger: path.join(v.runs, 'ledger.jsonl'),
    evidenceDir: path.join(v.runs, 'evidence'),
    handoffsDir: path.join(v.runs, 'handoffs'),
    blockersDir: path.join(v.runs, 'blockers'),
    viewExecutionFrontier: path.join(v.views, 'runs', 'EXECUTION_FRONTIER.md'),
    viewEvidenceLedger: path.join(v.views, 'runs', 'EVIDENCE_LEDGER.md'),
    viewBlockers: path.join(v.views, 'runs', 'BLOCKERS.md'),
  }
}

export const EXECUTOR_PATHS: ExecutorPathMap = buildExecutorPaths()

export const ATELIER_IGNORED_DIRS = new Set<string>([
  'node_modules',
  '.git',
  '.nx',
  '.next',
  'dist',
  'build',
  'coverage',
  'storybook-static',
  '.atelier-bootstrap',
  '.atelier',
  'result',
  'out',
  '.vercel',
])
