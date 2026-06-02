import { existsSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, markdownLinkExists } from './docs'
import {
  asStringArray,
  diagnosticSeverityRank,
  isKnownKind,
  type Diagnostic,
  type DiagnosticSeverity,
  type DoctorReport,
  type HarnessDocument,
} from './schema'

export type DoctorOptions = {
  projectRoot?: string
}

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function severityForMissingMetadata(document: HarnessDocument): DiagnosticSeverity {
  return document.strictness === 'strict' ? 'error' : 'warning'
}

function diagnosticSort(left: Diagnostic, right: Diagnostic) {
  return (
    diagnosticSeverityRank(left.severity) - diagnosticSeverityRank(right.severity) ||
    (left.path ?? '').localeCompare(right.path ?? '') ||
    (left.line ?? 0) - (right.line ?? 0) ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message)
  )
}

function lineNumbersContaining(raw: string, needle: string) {
  return raw
    .split(/\r?\n/)
    .map((line, index) => (line.includes(needle) ? index + 1 : null))
    .filter((line): line is number => line !== null)
}

function addFrontmatterDiagnostics(document: HarnessDocument, diagnostics: Diagnostic[]) {
  if (document.frontmatterError) {
    diagnostics.push({
      code: 'INVALID_FRONTMATTER',
      severity: severityForMissingMetadata(document),
      path: document.relativePath,
      message: `Invalid frontmatter: ${document.frontmatterError}`,
    })
    return
  }

  if (!idOf(document)) {
    diagnostics.push({
      code: 'MISSING_ID',
      severity: severityForMissingMetadata(document),
      path: document.relativePath,
      message: 'Document has no stable frontmatter id.',
    })
  }

  const kind = document.frontmatter?.kind
  if (kind !== undefined && !isKnownKind(kind)) {
    diagnostics.push({
      code: 'UNKNOWN_KIND',
      severity: document.strictness === 'strict' ? 'error' : 'warning',
      path: document.relativePath,
      message: `Unknown harness kind: ${String(kind)}`,
    })
  }
}

function addDuplicateIdDiagnostics(documents: HarnessDocument[], diagnostics: Diagnostic[]) {
  const byId = new Map<string, HarnessDocument[]>()

  for (const document of documents) {
    const id = idOf(document)
    if (!id) continue
    const existing = byId.get(id) ?? []
    existing.push(document)
    byId.set(id, existing)
  }

  for (const [id, matches] of byId) {
    if (matches.length < 2) continue

    for (const document of matches) {
      diagnostics.push({
        code: 'DUPLICATE_ID',
        severity: 'error',
        path: document.relativePath,
        message: `Duplicate harness id '${id}'.`,
        details: {
          id,
          paths: matches.map((match) => match.relativePath),
        },
      })
    }
  }
}

function addLinkDiagnostics(projectRoot: string, document: HarnessDocument, diagnostics: Diagnostic[]) {
  for (const link of document.links) {
    if (markdownLinkExists(projectRoot, document.absolutePath, link.target)) continue

    diagnostics.push({
      code: 'BROKEN_MARKDOWN_LINK',
      severity: 'warning',
      path: document.relativePath,
      line: link.line,
      message: `Broken Markdown link target '${link.target}'.`,
    })
  }
}

function addOldPathDiagnostics(document: HarnessDocument, diagnostics: Diagnostic[]) {
  for (const line of lineNumbersContaining(document.raw, 'harness/ai-org')) {
    diagnostics.push({
      code: 'OLD_HARNESS_AI_ORG_REFERENCE',
      severity: 'warning',
      path: document.relativePath,
      line,
      message: 'Document still references old harness/ai-org path.',
    })
  }
}

function addReferenceDiagnostics(documents: HarnessDocument[], diagnostics: Diagnostic[]) {
  const ids = new Set(documents.map(idOf).filter((id): id is string => id !== null))
  const phasePaths = new Set(
    documents
      .filter((document) => document.relativePath.startsWith('harness/actions/phases/'))
      .map((document) => document.relativePath),
  )

  for (const document of documents) {
    const phases = asStringArray(document.frontmatter?.phases)
    for (const phase of phases) {
      if (ids.has(phase)) continue

      const phasePath = phase.endsWith('.md')
        ? path.posix.normalize(path.posix.join(path.posix.dirname(document.relativePath), phase))
        : ''

      if (phasePath && phasePaths.has(phasePath)) continue

      diagnostics.push({
        code: 'MISSING_PHASE',
        severity: document.strictness === 'strict' ? 'error' : 'warning',
        path: document.relativePath,
        message: `Referenced phase '${phase}' was not found.`,
      })
    }
  }
}

export function runDoctor(options: DoctorOptions = {}): DoctorReport {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const harnessRoot = path.join(projectRoot, 'harness')
  const diagnostics: Diagnostic[] = []

  if (!existsSync(harnessRoot)) {
    diagnostics.push({
      code: 'BROKEN_MARKDOWN_LINK',
      severity: 'error',
      message: `Harness directory does not exist: ${harnessRoot}`,
    })
    return summarize(0, diagnostics)
  }

  const documents = loadHarnessDocuments(projectRoot)

  for (const document of documents) {
    addFrontmatterDiagnostics(document, diagnostics)
    addLinkDiagnostics(projectRoot, document, diagnostics)
    addOldPathDiagnostics(document, diagnostics)
  }

  addDuplicateIdDiagnostics(documents, diagnostics)
  addReferenceDiagnostics(documents, diagnostics)

  return summarize(documents.length, diagnostics.sort(diagnosticSort))
}

function summarize(documentCount: number, diagnostics: Diagnostic[]): DoctorReport {
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'error').length
  const warningCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'warning').length
  const infoCount = diagnostics.filter((diagnostic) => diagnostic.severity === 'info').length

  return {
    summary: {
      ok: errorCount === 0,
      documentCount,
      errorCount,
      warningCount,
      infoCount,
    },
    diagnostics,
  }
}

