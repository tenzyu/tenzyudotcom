export { buildContextPlan, normalizeContextMode, type ContextMode, type ContextPlan, type ContextPlanOptions } from './core/context'
export { runDoctor, type DoctorOptions } from './core/doctor'
export { loadHarnessDocuments, strictnessForPath, extractMarkdownLinks, sha256Text, toPosixPath } from './core/docs'
export { parseFrontmatter, type ParsedFrontmatter } from './core/frontmatter'
export { compileIndexes, type GeneratedFileName, type IndexOptions, type IndexResult } from './core/indexer'
export {
  promoteKnowledgeProposal,
  proposeKnowledge,
  rejectKnowledgeProposal,
  type KnowledgePromotionOptions,
  type KnowledgePromotionResult,
  type KnowledgeProposalOptions,
  type KnowledgeProposalResult,
  type KnowledgeRejectOptions,
  type KnowledgeRejectResult,
} from './core/knowledge'
export {
  closeRun,
  expandRunContext,
  initRun,
  renderContextForOptions,
  type ContextExpandOptions,
  type ContextExpandResult,
  type ContextRenderOptions,
  type ContextRenderResult,
  type RunCloseOptions,
  type RunCloseResult,
  type RunInitOptions,
  type RunInitResult,
} from './core/runs'
export type {
  Diagnostic,
  DiagnosticCode,
  DiagnosticSeverity,
  DoctorReport,
  DoctorSummary,
  HarnessDocument,
  HarnessFrontmatter,
  HarnessKind,
  HarnessStatus,
  MarkdownLink,
  Strictness,
} from './core/schema'
