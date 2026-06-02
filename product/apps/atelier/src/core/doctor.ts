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

const KNOWLEDGE_LEGACY_FIELDS = [
  'impactDescription',
  'chapter',
  'name',
  'description',
  'user-invocable',
]
const CURRENT_HARNESS_PREFIXES = [
  'harness/actions/',
  'harness/adapters/',
  'harness/canon/',
  'harness/knowledge/',
  'harness/observations/',
  'harness/policies/',
  'harness/runs/backlog/',
  'harness/runs/active/',
]

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function kindOf(document: HarnessDocument) {
  const kind = document.frontmatter?.kind
  return typeof kind === 'string' ? kind : null
}

function recordOf(value: unknown): Record<string, unknown> {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    Array.isArray(value)
  )
    return {}
  return value as Record<string, unknown>
}

function isCompletedRunHistory(document: HarnessDocument) {
  return document.relativePath.startsWith('harness/runs/completed/')
}

function isCurrentHarnessDocument(document: HarnessDocument) {
  if (isCompletedRunHistory(document)) return false
  return CURRENT_HARNESS_PREFIXES.some((prefix) =>
    document.relativePath.startsWith(prefix)
  )
}

function severityForMissingMetadata(
  document: HarnessDocument
): DiagnosticSeverity {
  return document.strictness === 'strict' ? 'error' : 'warning'
}

function diagnosticSort(left: Diagnostic, right: Diagnostic) {
  return (
    diagnosticSeverityRank(left.severity) -
      diagnosticSeverityRank(right.severity) ||
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

function addCompletedRunDiagnostics(
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  if (!document.frontmatter && !document.frontmatterError) return

  diagnostics.push({
    code: 'RUN_FRONTMATTER_IN_COMPLETED',
    severity: 'warning',
    path: document.relativePath,
    message:
      'Completed run history should remain loose historical text. Strip generated frontmatter instead of migrating old run records.',
  })
}

function addTagsDiagnostics(
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  if (!document.frontmatter || document.frontmatter.tags === undefined) return
  if (Array.isArray(document.frontmatter.tags)) return

  diagnostics.push({
    code: 'NON_ARRAY_TAGS',
    severity: document.strictness === 'strict' ? 'error' : 'warning',
    path: document.relativePath,
    message: 'Frontmatter tags must be a YAML sequence, not a scalar string.',
  })
}

function addKnowledgeDiagnostics(
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  if (!document.frontmatter || kindOf(document) !== 'knowledge') return

  if (Array.isArray(document.frontmatter.roles)) {
    diagnostics.push({
      code: 'KNOWLEDGE_ROLE_REFERENCE',
      severity: 'warning',
      path: document.relativePath,
      message:
        'Knowledge must not manually point back to roles. Keep role routing in role selectors and generated indexes.',
    })
  }

  for (const field of KNOWLEDGE_LEGACY_FIELDS) {
    if (!(field in document.frontmatter)) continue

    diagnostics.push({
      code: 'DISALLOWED_FRONTMATTER_FIELD',
      severity: 'warning',
      path: document.relativePath,
      message: `Knowledge field '${field}' is legacy metadata. Move it under x.legacy or remove it.`,
      details: { field },
    })
  }
}

function addRoleDiagnostics(
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  if (!document.frontmatter || kindOf(document) !== 'role') return
  if (document.frontmatter.role_type !== 'domain') return

  const selectors = recordOf(document.frontmatter.selectors)
  const selectorPaths = asStringArray(selectors.paths)
  const selectorTags = asStringArray(selectors.tags)
  const selectorTypes = asStringArray(selectors.knowledge_types)
  const pinned = asStringArray(document.frontmatter.pinned)

  if (
    selectorPaths.length === 0 &&
    selectorTags.length === 0 &&
    selectorTypes.length === 0
  ) {
    diagnostics.push({
      code: 'ROLE_ROUTING_MISSING',
      severity: 'error',
      path: document.relativePath,
      message:
        'Domain roles must declare selectors so Atelier can route context deterministically.',
    })
  }

  if (pinned.length === 0) {
    diagnostics.push({
      code: 'ROLE_ROUTING_MISSING',
      severity: 'error',
      path: document.relativePath,
      message:
        'Domain roles must declare pinned context for stable required knowledge.',
    })
  }
}

function addFrontmatterDiagnostics(
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  if (isCompletedRunHistory(document)) {
    addCompletedRunDiagnostics(document, diagnostics)
    return
  }

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

  addTagsDiagnostics(document, diagnostics)
  addKnowledgeDiagnostics(document, diagnostics)
  addRoleDiagnostics(document, diagnostics)
}

function addDuplicateIdDiagnostics(
  documents: HarnessDocument[],
  diagnostics: Diagnostic[]
) {
  const byId = new Map<string, HarnessDocument[]>()

  for (const document of documents) {
    if (isCompletedRunHistory(document)) continue
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

function addLinkDiagnostics(
  projectRoot: string,
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  for (const link of document.links) {
    if (markdownLinkExists(projectRoot, document.absolutePath, link.target))
      continue

    diagnostics.push({
      code: 'BROKEN_MARKDOWN_LINK',
      severity: isCurrentHarnessDocument(document) ? 'error' : 'warning',
      path: document.relativePath,
      line: link.line,
      message: `Broken Markdown link target '${link.target}'.`,
    })
  }
}

function addOldPathDiagnostics(
  document: HarnessDocument,
  diagnostics: Diagnostic[]
) {
  for (const line of lineNumbersContaining(document.raw, 'harness/ai-org')) {
    diagnostics.push({
      code: 'OLD_HARNESS_AI_ORG_REFERENCE',
      severity: isCurrentHarnessDocument(document) ? 'error' : 'warning',
      path: document.relativePath,
      line,
      message: 'Document still references old harness/ai-org path.',
    })
  }
}

function addReferenceDiagnostics(
  documents: HarnessDocument[],
  diagnostics: Diagnostic[]
) {
  const activeDocuments = documents.filter(
    (document) => !isCompletedRunHistory(document)
  )
  const ids = new Set(
    activeDocuments.map(idOf).filter((id): id is string => id !== null)
  )
  const phasePaths = new Set(
    activeDocuments
      .filter((document) =>
        document.relativePath.startsWith('harness/actions/phases/')
      )
      .map((document) => document.relativePath)
  )

  for (const document of activeDocuments) {
    const phases = asStringArray(document.frontmatter?.phases)
    for (const phase of phases) {
      if (ids.has(phase)) continue

      const phasePath = phase.endsWith('.md')
        ? path.posix.normalize(
            path.posix.join(path.posix.dirname(document.relativePath), phase)
          )
        : ''

      if (phasePath && phasePaths.has(phasePath)) continue

      diagnostics.push({
        code: 'MISSING_PHASE',
        severity: document.strictness === 'strict' ? 'error' : 'warning',
        path: document.relativePath,
        message: `Referenced phase '${phase}' was not found.`,
      })
    }

    const pinned = asStringArray(document.frontmatter?.pinned)
    for (const pinnedId of pinned) {
      if (ids.has(pinnedId)) continue
      diagnostics.push({
        code: 'UNRESOLVED_ID_REFERENCE',
        severity: document.strictness === 'strict' ? 'error' : 'warning',
        path: document.relativePath,
        message: `Pinned context '${pinnedId}' was not found.`,
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

function summarize(
  documentCount: number,
  diagnostics: Diagnostic[]
): DoctorReport {
  const errorCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error'
  ).length
  const warningCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'warning'
  ).length
  const infoCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'info'
  ).length

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
