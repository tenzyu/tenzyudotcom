export { runDoctor, type DoctorOptions } from './core/doctor'
export { loadHarnessDocuments, strictnessForPath, extractMarkdownLinks } from './core/docs'
export { parseFrontmatter, type ParsedFrontmatter } from './core/frontmatter'
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

