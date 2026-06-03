import path from 'node:path'
import { loadHarnessDocuments, toPosixPath } from './docs'
import { asStringArray, type Diagnostic, type HarnessDocument } from './schema'
import {
  buildSemanticQuery,
  runSemanticExpansion,
  type SemanticHit,
} from './semantic'

export type ContextPlanOptions = {
  projectRoot?: string
  workflowId: string
  roleIds: string[]
  inputPath: string
  intent: string
  requiredOnly?: boolean
  mode?: ContextMode
  semantic?: boolean
  semanticMaxResults?: number
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
  count?: number
}

export type SelectorMatchTrace = {
  type: 'require_all' | 'require_any' | 'exclude' | 'path' | 'pinned' | 'relation'
  selector: string
  matched: boolean
  matchedTags?: string[]
}

export type ConditionEvaluation = {
  type: 'deterministic' | 'semantic'
  condition: string
  matched: boolean
  method?: 'mechanical' | 'llm'
  confidence?: string
}

export type ContextPlan = {
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
  nextRenderCommand: string
  semantic: {
    enabled: boolean
    hits: SemanticHit[]
    unknownTerms: string[]
  }
  nextRunInitCommand: string
  trace: {
    selections: Array<{
      id: string | null
      path: string
      reasons: string[]
      selectorMatches: SelectorMatchTrace[]
    }>
  }
}

const TOKEN_BUDGET = 50_000
const CONTEXT_MODES = new Set<ContextMode>(['compact', 'full', 'linked'])
const REQUIRED_PHASE_IDS = new Set([
  'phase.intake',
  'phase.investigation',
  'phase.implementation',
  'phase.verification',
  'phase.handoff',
])
const CONDITIONAL_PHASE_IDS = new Set([
  'phase.worktree-isolation',
  'phase.planning',
  'phase.review',
  'phase.knowledge-promotion',
  'phase.adr-distillation',
])

export function normalizeContextMode(value: string | undefined): ContextMode {
  if (value === undefined) return 'compact'
  if (CONTEXT_MODES.has(value as ContextMode)) return value as ContextMode
  throw new Error(
    `Unknown context mode '${value}'. Expected compact, full, or linked.`
  )
}

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
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

function estimateTokens(document: HarnessDocument, mode: ContextMode) {
  if (mode === 'linked') return 150
  const rawEstimate = Math.ceil(document.raw.length / 4)
  if (mode === 'compact') return Math.min(rawEstimate, 550)
  return Math.min(rawEstimate, 3_000)
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

function matchesPathPattern(pattern: string, value: string) {
  if (matchesGlob(pattern, value)) return true
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3)
    return value === prefix || value.startsWith(`${prefix}/`)
  }
  return false
}

function normalizedInputPath(projectRoot: string, inputPath: string) {
  const resolved = path.isAbsolute(inputPath)
    ? inputPath
    : path.resolve(projectRoot, inputPath)
  return toPosixPath(path.relative(projectRoot, resolved))
}

function documentSummary(
  document: HarnessDocument,
  reasons: string[],
  mode: ContextMode
): SelectedContextDocument {
  return {
    id: idOf(document),
    kind: textOf(document.frontmatter?.kind),
    path: document.relativePath,
    title: textOf(document.frontmatter?.title),
    status: textOf(document.frontmatter?.status),
    sha256: document.sha256,
    reasons,
    tokenEstimate: estimateTokens(document, mode),
  }
}

function addSelected(
  map: Map<string, { document: HarnessDocument; reasons: Set<string> }>,
  document: HarnessDocument | undefined,
  reason: string
) {
  if (!document) return
  const existing = map.get(document.relativePath)
  if (existing) {
    existing.reasons.add(reason)
    return
  }
  map.set(document.relativePath, { document, reasons: new Set([reason]) })
}

function addSkipped(
  skipped: SkippedContextDocument[],
  document: HarnessDocument | undefined,
  pathOrId: string,
  reason: string,
  count?: number
) {
  skipped.push({
    id: document ? idOf(document) : null,
    path: document?.relativePath ?? pathOrId,
    reason,
    count,
  })
}

function parseMarkdownListSection(body: string, heading: string) {
  const lines = body.split(/\r?\n/)
  const start = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`
  )
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
      .filter(
        (entry): entry is readonly [string, HarnessDocument] =>
          entry[0] !== null
      )
  )
}

function byPath(documents: HarnessDocument[]) {
  return new Map(
    documents.map((document) => [document.relativePath, document] as const)
  )
}

function resolveReference(
  reference: string,
  documentsById: Map<string, HarnessDocument>,
  documentsByPath: Map<string, HarnessDocument>
) {
  const clean = reference.replace(/^[\'"]|[\'"]$/g, '').replace(/\/$/, '')
  return (
    documentsById.get(clean) ??
    documentsByPath.get(clean) ??
    documentsByPath.get(`${clean}.md`)
  )
}

function relevantTokens(inputPath: string, intent: string) {
  const raw = `${inputPath} ${intent}`.toLowerCase()
  return new Set(
    raw
      .split(/[^a-z0-9_-]+/)
      .map((token) => token.trim())
      .filter((token) => token.length >= 4)
  )
}

function metadataSignalText(document: HarnessDocument) {
  const frontmatter = document.frontmatter ?? {}
  const scope = recordOf(frontmatter.scope)
  return [
    document.relativePath,
    textOf(frontmatter.id),
    textOf(frontmatter.title),
    textOf(frontmatter.summary),
    textOf(frontmatter.knowledge_type),
    ...asStringArray(frontmatter.tags),
    ...asStringArray(scope.paths),
    ...document.headings,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join('\n')
    .toLowerCase()
}

function documentMatchesMetadataSignals(
  document: HarnessDocument,
  tokens: Set<string>
) {
  const haystack = metadataSignalText(document)
  for (const token of tokens) {
    if (haystack.includes(token)) return true
  }
  return false
}

function knowledgeScopeMatches(document: HarnessDocument, inputPath: string) {
  const scope = recordOf(document.frontmatter?.scope)
  const scopePaths = asStringArray(scope.paths)
  return scopePaths.some((pattern) => matchesPathPattern(pattern, inputPath))
}

function roleSelectorPathActive(roleSelectorPaths: Set<string>, inputPath: string) {
  return (
    roleSelectorPaths.size === 0 ||
    [...roleSelectorPaths].some((selectorPath) =>
      matchesPathPattern(selectorPath, inputPath)
    )
  )
}

function roleSelectorTagsOverlap(
  document: HarnessDocument,
  roleSelectorTags: Set<string>
) {
  const tags = asStringArray(document.frontmatter?.tags)
  return tags.some((tag) => roleSelectorTags.has(tag))
}

function roleSelectorTypeMatches(
  document: HarnessDocument,
  roleSelectorTypes: Set<string>
) {
  const knowledgeType = textOf(document.frontmatter?.knowledge_type)
  return knowledgeType !== null && roleSelectorTypes.has(knowledgeType)
}

// === Knowledge Card Model tag matching ===

function documentHasAllTags(document: HarnessDocument, requiredTags: string[]) {
  if (requiredTags.length === 0) return true
  const tags = new Set(asStringArray(document.frontmatter?.tags))
  return requiredTags.every((tag) => tags.has(tag))
}

function documentHasAnyTag(document: HarnessDocument, candidateTags: string[]) {
  if (candidateTags.length === 0) return true
  const tags = new Set(asStringArray(document.frontmatter?.tags))
  return candidateTags.some((tag) => tags.has(tag))
}

function documentExcludedByTags(document: HarnessDocument, excludeTags: string[]) {
  if (excludeTags.length === 0) return false
  const tags = new Set(asStringArray(document.frontmatter?.tags))
  return excludeTags.some((tag) => tags.has(tag))
}

function parseSelectors(selectors: Record<string, unknown>) {
  return {
    requireAll: asStringArray(selectors.require_all),
    requireAny: asStringArray(selectors.require_any),
    exclude: asStringArray(selectors.exclude),
    paths: asStringArray(selectors.paths),
    // legacy fallback
    tags: asStringArray(selectors.tags),
    knowledgeTypes: asStringArray(selectors.knowledge_types),
  }
}

function recordSelectorTrace(
  type: SelectorMatchTrace['type'],
  selector: string,
  matched: boolean,
  matchedTags?: string[]
): SelectorMatchTrace {
  return { type, selector, matched, matchedTags }
}

function requiredPhaseIds(workflow: HarnessDocument | undefined) {
  const explicit = asStringArray(workflow?.frontmatter?.required_phases)
  if (explicit.length > 0) return explicit
  return asStringArray(workflow?.frontmatter?.phases).filter(
    (phaseId) => !CONDITIONAL_PHASE_IDS.has(phaseId)
  )
}

function conditionalPhaseIds(workflow: HarnessDocument | undefined) {
  const explicit = asStringArray(workflow?.frontmatter?.conditional_phases)
  if (explicit.length > 0) return explicit
  return asStringArray(workflow?.frontmatter?.phases).filter(
    (phaseId) =>
      CONDITIONAL_PHASE_IDS.has(phaseId) || !REQUIRED_PHASE_IDS.has(phaseId)
  )
}

export function buildContextPlan(options: ContextPlanOptions): ContextPlan {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const inputPath = normalizedInputPath(projectRoot, options.inputPath)
  const mode = normalizeContextMode(options.mode)
  const documents = loadHarnessDocuments(projectRoot)
  const documentsById = byId(documents)
  const documentsByPath = byPath(documents)
  const required = new Map<
    string,
    { document: HarnessDocument; reasons: Set<string> }
  >()
  const optional = new Map<
    string,
    { document: HarnessDocument; reasons: Set<string> }
  >()
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
    addSelected(
      required,
      role,
      index === 0 ? 'requested primary role' : 'requested supporting role'
    )
  }

  addSelected(required, documentsById.get('policy.repository'), 'repository policy')

  for (const phaseId of requiredPhaseIds(workflow)) {
    addSelected(required, documentsById.get(phaseId), `required workflow phase '${phaseId}'`)
  }

  for (const phaseId of conditionalPhaseIds(workflow)) {
    addSkipped(
      skipped,
      documentsById.get(phaseId),
      phaseId,
      'conditional workflow phase is not loaded by default'
    )
  }

  const tokens = relevantTokens(inputPath, options.intent)
  const roleSelectorTags = new Set<string>()
  const roleSelectorTypes = new Set<string>()
  const roleSelectorPaths = new Set<string>()
  const roleSelectorRequireAll: string[] = []
  const roleSelectorRequireAny: string[] = []
  const roleSelectorExclude: string[] = []
  const traceEntries: Array<{
    id: string | null
    path: string
    reasons: string[]
    selectorMatches: SelectorMatchTrace[]
  }> = []

  for (const role of roles.filter(
    (candidate): candidate is HarnessDocument => candidate !== undefined
  )) {
    for (const pinnedId of asStringArray(role.frontmatter?.pinned)) {
      addSelected(required, documentsById.get(pinnedId), `pinned by role '${idOf(role)}'`)
    }

    for (const reference of parseMarkdownListSection(role.body, 'Required knowledge')) {
      addSelected(
        required,
        resolveReference(reference, documentsById, documentsByPath),
        `required by role '${idOf(role)}'`
      )
    }

    const selectors = recordOf(role.frontmatter?.selectors)
    // new format
    for (const tag of asStringArray(selectors.require_all)) roleSelectorRequireAll.push(tag)
    for (const tag of asStringArray(selectors.require_any)) roleSelectorRequireAny.push(tag)
    for (const tag of asStringArray(selectors.exclude)) roleSelectorExclude.push(tag)
    // legacy fallback
    for (const tag of asStringArray(selectors.tags)) roleSelectorTags.add(tag)
    for (const type of asStringArray(selectors.knowledge_types))
      roleSelectorTypes.add(type)
    for (const selectorPath of asStringArray(selectors.paths))
      roleSelectorPaths.add(selectorPath)
  }

  const rolePathActive = roleSelectorPathActive(roleSelectorPaths, inputPath)

  // Helper to trace selector decisions
  function traceSelectors(
    document: HarnessDocument,
    matched: boolean,
    allMatch: string[],
    anyMatch: string[]
  ) {
    const traces: SelectorMatchTrace[] = []
    if (roleSelectorRequireAll.length > 0) {
      traces.push(recordSelectorTrace('require_all', roleSelectorRequireAll.join(', '), allMatch.length === roleSelectorRequireAll.length, allMatch))
    }
    if (roleSelectorRequireAny.length > 0) {
      traces.push(recordSelectorTrace('require_any', roleSelectorRequireAny.join(', '), anyMatch.length > 0, anyMatch))
    }
    traceEntries.push({
      id: idOf(document),
      path: document.relativePath,
      reasons: [matched ? 'selector matched' : 'selector did not match'],
      selectorMatches: traces,
    })
  }

  for (const role of roles.filter(
    (candidate): candidate is HarnessDocument => candidate !== undefined
  )) {
    for (const reference of parseMarkdownListSection(role.body, 'Optional knowledge')) {
      const resolved = resolveReference(reference, documentsById, documentsByPath)
      if (!resolved) {
        addSkipped(
          skipped,
          undefined,
          reference,
          'optional directory or unresolved reference was not expanded'
        )
        continue
      }

      if (options.requiredOnly) {
        addSkipped(skipped, resolved, resolved.relativePath, 'optional context suppressed by --required-only')
        continue
      }

      const matchesSignals =
        documentMatchesMetadataSignals(resolved, tokens) ||
        (rolePathActive && roleSelectorTagsOverlap(resolved, roleSelectorTags)) ||
        (rolePathActive &&
          roleSelectorTypeMatches(resolved, roleSelectorTypes) &&
          knowledgeScopeMatches(resolved, inputPath))

      if (matchesSignals) {
        addSelected(
          optional,
          resolved,
          `optional role knowledge matched metadata signals for intent '${options.intent}'`
        )
      } else {
        addSkipped(
          skipped,
          resolved,
          resolved.relativePath,
          'optional role knowledge did not match metadata signals'
        )
      }
    }
  }

  for (const document of documents.filter(
    (candidate) => candidate.frontmatter?.kind === 'knowledge'
  )) {
    const knowledgeType = textOf(document.frontmatter?.knowledge_type)
    const isKnownProblemOrIncident =
      knowledgeType === 'known-problem' || knowledgeType === 'incident'

    // New selector format: require_all / require_any / exclude
    if (roleSelectorRequireAll.length > 0 || roleSelectorRequireAny.length > 0) {
      const allTags = asStringArray(document.frontmatter?.tags)
      const allMatch = roleSelectorRequireAll.filter((t) => allTags.includes(t))
      const anyMatch = roleSelectorRequireAny.filter((t) => allTags.includes(t))
      const excluded = roleSelectorExclude.filter((t) => allTags.includes(t))

      const allMet = roleSelectorRequireAll.length === 0 || allMatch.length === roleSelectorRequireAll.length
      const anyMet = roleSelectorRequireAny.length === 0 || anyMatch.length > 0

      if (excluded.length > 0) {
        traceSelectors(document, false, allMatch, anyMatch)
        addSkipped(skipped, document, document.relativePath, 'excluded by role selector')
        continue
      }

      if (allMet && anyMet) {
        traceSelectors(document, true, allMatch, anyMatch)
        if (documentHasAllTags(document, ['criticality:fatal', 'criticality:high'])) {
          addSelected(required, document, 'required by role selectors (high criticality)')
        } else {
          addSelected(optional, document, 'matched role selectors')
        }
        continue
      }

      if (!allMet || !anyMet) {
        traceSelectors(document, false, allMatch, anyMatch)
      }
    }

    // Legacy: knowledge scope path match
    if (rolePathActive && knowledgeScopeMatches(document, inputPath)) {
      addSelected(required, document, `knowledge scope matched path '${inputPath}'`)
      continue
    }

    // Legacy: type + tag + signal
    if (
      !options.requiredOnly &&
      rolePathActive &&
      roleSelectorTypeMatches(document, roleSelectorTypes) &&
      roleSelectorTagsOverlap(document, roleSelectorTags) &&
      documentMatchesMetadataSignals(document, tokens)
    ) {
      addSelected(optional, document, 'role selectors matched tags, knowledge type, and metadata signals')
      continue
    }

    // Known-problem/incident fallback
    if (
      !options.requiredOnly &&
      isKnownProblemOrIncident &&
      documentMatchesMetadataSignals(document, tokens)
    ) {
      addSelected(optional, document, 'known problem or incident matched metadata signals')
      continue
    }
  }

  const completedRunCount = documents.filter((candidate) =>
    candidate.relativePath.startsWith('harness/runs/completed/')
  ).length
  if (completedRunCount > 0) {
    skipped.push({
      id: null,
      path: 'harness/runs/completed/**',
      reason: 'completed run history is skipped by default',
      count: completedRunCount,
    })
  }

  const requiredDocuments = [...required.values()]
    .map(({ document, reasons }) => documentSummary(document, [...reasons].sort(), mode))
    .sort((left, right) => left.path.localeCompare(right.path))
  const optionalDocuments = [...optional.values()]
    .filter(({ document }) => !required.has(document.relativePath))
    .map(({ document, reasons }) => documentSummary(document, [...reasons].sort(), mode))
    .sort((left, right) => left.path.localeCompare(right.path))

  const tokensEstimate = [...requiredDocuments, ...optionalDocuments].reduce(
    (sum, document) => sum + document.tokenEstimate,
    0
  )
  if (tokensEstimate > TOKEN_BUDGET) {
    diagnostics.push({
      code: 'CONTEXT_BUDGET_EXCEEDED',
      severity: 'warning',
      message: `Selected context estimate ${tokensEstimate} exceeds budget ${TOKEN_BUDGET}.`,
    })
  }

  const commandArgs = [
    `--workflow ${options.workflowId}`,
    ...options.roleIds.map((roleId) => `--role ${roleId}`),
    `--path ${inputPath}`,
    `--intent ${JSON.stringify(options.intent)}`,
    `--mode ${mode}`,
  ].join(' ')

  const semantic = runSemanticExpansion(
    {
      projectRoot,
      enabled: options.semantic === true,
      maxResults: options.semanticMaxResults,
    },
    buildSemanticQuery(options.intent, inputPath),
  )

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
    nextRenderCommand: `atelier context render ${commandArgs}`,
    nextRunInitCommand: `atelier run init ${commandArgs}`,
    semantic: {
      enabled: semantic.enabled,
      hits: semantic.hits,
      unknownTerms: semantic.unknownTerms,
    },
    trace: {
      selections: traceEntries,
    },
  }
}
