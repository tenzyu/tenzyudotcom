import path from 'node:path'
import { loadHarnessDocuments, toPosixPath } from './docs'
import { asStringArray, type Diagnostic, type HarnessDocument } from './schema'

export type ContextPreviewOptions = {
  projectRoot?: string
  workflowId: string
  roleIds: string[]
  inputPath: string
  intent: string
  requiredOnly?: boolean
  mode?: ContextMode
}

export type ContextMode = 'compact' | 'full' | 'linked'

export type SelectedContextDocument = {
  id: string | null
  kind: string | null
  path: string
  title: string | null
  status: string | null
  sha256: string
  reasons: string[]
  tokenEstimate: number
}

export type SkippedContextDocument = {
  id: string | null
  path: string
  reason: string
}

export type ContextPreview = {
  workflowId: string
  roleIds: string[]
  inputPath: string
  intent: string
  mode: ContextMode
  required: SelectedContextDocument[]
  optional: SelectedContextDocument[]
  skipped: SkippedContextDocument[]
  diagnostics: Diagnostic[]
  budgetEstimate: {
    tokens: number
    limit: number
    exceeded: boolean
  }
  nextCommand: string
}

const TOKEN_BUDGET = 50_000
const CONTEXT_MODES = new Set<ContextMode>(['compact', 'full', 'linked'])

export function normalizeContextMode(value: string | undefined): ContextMode {
  if (value === undefined) return 'compact'
  if (CONTEXT_MODES.has(value as ContextMode)) return value as ContextMode
  throw new Error(`Unknown context mode '${value}'. Expected compact, full, or linked.`)
}

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
}

function recordOf(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function estimateTokens(document: HarnessDocument) {
  return Math.ceil(document.raw.length / 4)
}

function globToRegExp(pattern: string) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '\u0000')
    .replace(/\*/g, '[^/]*')
    .replace(/\u0000/g, '.*')
  return new RegExp(`^${escaped}$`)
}

function matchesGlob(pattern: string, value: string) {
  return globToRegExp(pattern).test(value)
}

function normalizedInputPath(projectRoot: string, inputPath: string) {
  const resolved = path.isAbsolute(inputPath) ? inputPath : path.resolve(projectRoot, inputPath)
  return toPosixPath(path.relative(projectRoot, resolved))
}

function documentSummary(document: HarnessDocument, reasons: string[]): SelectedContextDocument {
  return {
    id: idOf(document),
    kind: textOf(document.frontmatter?.kind),
    path: document.relativePath,
    title: textOf(document.frontmatter?.title),
    status: textOf(document.frontmatter?.status),
    sha256: document.sha256,
    reasons,
    tokenEstimate: estimateTokens(document),
  }
}

function addSelected(
  map: Map<string, { document: HarnessDocument; reasons: Set<string> }>,
  document: HarnessDocument | undefined,
  reason: string,
) {
  if (!document) return
  const existing = map.get(document.relativePath)
  if (existing) {
    existing.reasons.add(reason)
    return
  }
  map.set(document.relativePath, { document, reasons: new Set([reason]) })
}

function parseMarkdownListSection(body: string, heading: string) {
  const lines = body.split(/\r?\n/)
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`)
  if (start === -1) return []

  const refs: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+/.test(line)) break
    const match = line.match(/^\s*-\s+`?([^`\n]+?)`?\s*$/)
    if (!match?.[1]) continue
    refs.push(match[1].trim())
  }
  return refs
}

function byId(documents: HarnessDocument[]) {
  return new Map(
    documents
      .map((document) => [idOf(document), document] as const)
      .filter((entry): entry is readonly [string, HarnessDocument] => entry[0] !== null),
  )
}

function byPath(documents: HarnessDocument[]) {
  return new Map(documents.map((document) => [document.relativePath, document] as const))
}

function resolveReference(
  reference: string,
  documentsById: Map<string, HarnessDocument>,
  documentsByPath: Map<string, HarnessDocument>,
) {
  const clean = reference.replace(/^['"]|['"]$/g, '').replace(/\/$/, '')
  return documentsById.get(clean) ?? documentsByPath.get(clean) ?? documentsByPath.get(`${clean}.md`)
}

function relevantTokens(inputPath: string, intent: string) {
  const raw = `${inputPath} ${intent}`.toLowerCase()
  return new Set(
    raw
      .split(/[^a-z0-9_-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4),
  )
}

function documentMatchesTokens(document: HarnessDocument, tokens: Set<string>) {
  const haystack = `${document.relativePath}\n${document.frontmatterRaw ?? ''}\n${document.body}`.toLowerCase()
  for (const token of tokens) {
    if (haystack.includes(token)) return true
  }
  return false
}

function knowledgeScopeMatches(document: HarnessDocument, inputPath: string) {
  const scope = recordOf(document.frontmatter?.scope)
  const scopePaths = asStringArray(scope.paths)
  return scopePaths.some((pattern) => matchesGlob(pattern, inputPath) || inputPath.startsWith(pattern.replace(/\*\*?$/, '')))
}

function productSpecMatchesPath(document: HarnessDocument, inputPath: string) {
  const match = inputPath.match(/^product\/apps\/([^/]+)/)
  if (!match?.[1]) return false
  return document.relativePath.startsWith(`harness/knowledge/product-specs/${match[1]}/`)
}

export function buildContextPreview(options: ContextPreviewOptions): ContextPreview {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const inputPath = normalizedInputPath(projectRoot, options.inputPath)
  const mode = normalizeContextMode(options.mode)
  const documents = loadHarnessDocuments(projectRoot)
  const documentsById = byId(documents)
  const documentsByPath = byPath(documents)
  const required = new Map<string, { document: HarnessDocument; reasons: Set<string> }>()
  const optional = new Map<string, { document: HarnessDocument; reasons: Set<string> }>()
  const skipped: SkippedContextDocument[] = []
  const diagnostics: Diagnostic[] = []

  const workflow = documentsById.get(options.workflowId)
  if (!workflow) {
    diagnostics.push({
      code: 'MISSING_WORKFLOW',
      severity: 'error',
      message: `Workflow '${options.workflowId}' was not found.`,
    })
  } else {
    addSelected(required, workflow, 'requested workflow')
  }

  const roles = options.roleIds.map((roleId) => documentsById.get(roleId))
  for (let index = 0; index < options.roleIds.length; index += 1) {
    const roleId = options.roleIds[index]
    const role = roles[index]
    if (!role) {
      diagnostics.push({
        code: 'MISSING_ROLE',
        severity: 'error',
        message: `Role '${roleId}' was not found.`,
      })
      continue
    }
    addSelected(required, role, index === 0 ? 'requested primary role' : 'requested supporting role')
  }

  addSelected(required, documentsById.get('policy.repository'), 'repository policy')

  for (const phaseId of asStringArray(workflow?.frontmatter?.phases)) {
    addSelected(required, documentsById.get(phaseId), `workflow phase '${phaseId}'`)
  }

  const tokens = relevantTokens(inputPath, options.intent)
  const roleSelectorTags = new Set<string>()
  const roleSelectorTypes = new Set<string>()
  const roleSelectorPaths = new Set<string>()

  for (const role of roles.filter((candidate): candidate is HarnessDocument => candidate !== undefined)) {
    for (const pinnedId of asStringArray(role.frontmatter?.pinned)) {
      addSelected(required, documentsById.get(pinnedId), `pinned by role '${idOf(role)}'`)
    }

    for (const reference of parseMarkdownListSection(role.body, 'Required knowledge')) {
      addSelected(required, resolveReference(reference, documentsById, documentsByPath), `required by role '${idOf(role)}'`)
    }

    for (const reference of parseMarkdownListSection(role.body, 'Optional knowledge')) {
      const resolved = resolveReference(reference, documentsById, documentsByPath)
      if (resolved && !options.requiredOnly && documentMatchesTokens(resolved, tokens)) {
        addSelected(optional, resolved, `optional role knowledge matched intent '${options.intent}'`)
      } else if (resolved) {
        skipped.push({ id: idOf(resolved), path: resolved.relativePath, reason: 'optional role knowledge did not match intent' })
      } else {
        skipped.push({ id: null, path: reference, reason: 'optional directory or unresolved reference was not expanded' })
      }
    }

    const selectors = recordOf(role.frontmatter?.selectors)
    for (const tag of asStringArray(selectors.tags)) roleSelectorTags.add(tag)
    for (const type of asStringArray(selectors.knowledge_types)) roleSelectorTypes.add(type)
    for (const selectorPath of asStringArray(selectors.paths)) roleSelectorPaths.add(selectorPath)
  }

  const rolePathActive =
    roleSelectorPaths.size === 0 || [...roleSelectorPaths].some((selectorPath) => matchesGlob(selectorPath, inputPath))

  for (const document of documents.filter((candidate) => candidate.frontmatter?.kind === 'knowledge')) {
    const knowledgeType = textOf(document.frontmatter?.knowledge_type)
    const tags = asStringArray(document.frontmatter?.tags)
    const isKnownProblemOrIncident = knowledgeType === 'known-problem' || knowledgeType === 'incident'

    if (rolePathActive && (knowledgeScopeMatches(document, inputPath) || productSpecMatchesPath(document, inputPath))) {
      addSelected(required, document, `knowledge scope matched path '${inputPath}'`)
      continue
    }

    if (
      !options.requiredOnly &&
      knowledgeType !== null &&
      roleSelectorTypes.has(knowledgeType) &&
      tags.some((tag) => roleSelectorTags.has(tag)) &&
      documentMatchesTokens(document, tokens)
    ) {
      addSelected(optional, document, 'role selectors matched tags, knowledge type, and intent')
      continue
    }

    if (!options.requiredOnly && isKnownProblemOrIncident && documentMatchesTokens(document, tokens)) {
      addSelected(optional, document, 'known problem or incident matched intent')
      continue
    }
  }

  for (const document of documents.filter((candidate) => candidate.relativePath.startsWith('harness/runs/completed/'))) {
    skipped.push({ id: idOf(document), path: document.relativePath, reason: 'completed run history is skipped by default' })
  }

  const requiredDocuments = [...required.values()]
    .map(({ document, reasons }) => documentSummary(document, [...reasons].sort()))
    .sort((left, right) => left.path.localeCompare(right.path))
  const optionalDocuments = [...optional.values()]
    .filter(({ document }) => !required.has(document.relativePath))
    .map(({ document, reasons }) => documentSummary(document, [...reasons].sort()))
    .sort((left, right) => left.path.localeCompare(right.path))

  const tokensEstimate = [...requiredDocuments, ...optionalDocuments].reduce((sum, document) => sum + document.tokenEstimate, 0)
  if (tokensEstimate > TOKEN_BUDGET) {
    diagnostics.push({
      code: 'CONTEXT_BUDGET_EXCEEDED',
      severity: 'warning',
      message: `Selected context estimate ${tokensEstimate} exceeds budget ${TOKEN_BUDGET}.`,
    })
  }

  return {
    workflowId: options.workflowId,
    roleIds: options.roleIds,
    inputPath,
    intent: options.intent,
    mode,
    required: requiredDocuments,
    optional: optionalDocuments,
    skipped: skipped.sort((left, right) => left.path.localeCompare(right.path)),
    diagnostics,
    budgetEstimate: {
      tokens: tokensEstimate,
      limit: TOKEN_BUDGET,
      exceeded: tokensEstimate > TOKEN_BUDGET,
    },
    nextCommand: [
      'atelier run init',
      `--workflow ${options.workflowId}`,
      ...options.roleIds.map((roleId) => `--role ${roleId}`),
      `--path ${inputPath}`,
      `--intent ${JSON.stringify(options.intent)}`,
      `--mode ${mode}`,
    ].join(' '),
  }
}
