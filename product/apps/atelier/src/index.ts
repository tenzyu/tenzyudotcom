export { buildContextPreview, type ContextPreview, type ContextPreviewOptions } from './core/context'
export { runDoctor, type DoctorOptions } from './core/doctor'
export { loadHarnessDocuments, strictnessForPath, extractMarkdownLinks, sha256Text, toPosixPath } from './core/docs'
export { parseFrontmatter, type ParsedFrontmatter } from './core/frontmatter'
export { compileIndexes, type GeneratedFileName, type IndexOptions, type IndexResult } from './core/indexer'
export { initRun, type RunInitOptions, type RunInitResult } from './core/runs'
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
