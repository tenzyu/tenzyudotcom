import path from 'node:path'
import { loadHarnessDocuments, toPosixPath } from './docs'
import { readGraph } from './graph'
import {
  buildContextRenderCommand,
  buildRunInitCommand,
  enrichMissingSymbolDiagnostic,
  inferRoleIds,
} from './llm-protocol'
import { asStringArray, type Diagnostic, type HarnessDocument, type SelectorV2Trace, type PermissionEnvelope } from './schema'
import { suggestAffordances } from './knowledge'
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

export type RelationResolveTrace = {
  type: 'inherit' | 'require_context' | 'require_constant' | 'require_decision' | 'related' | 'conflicts'
  target: string
  mode: string
  resolved: boolean
  reason: string
  inheritedTags?: string[]
}

export type RelationTarget = {
  id: string
  mode: 'full' | 'summary' | 'reference'
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
      pattern?: string | null
      relations?: RelationResolveTrace[]
      conditions?: ConditionEvaluation[]
      affordances?: {
        declared: string[]
        inferred: string[]
        accepted: string[]
      }
    }>
  }
  selectorV2?: {
    traces: SelectorV2Trace[]
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
  const relativePath = toPosixPath(path.relative(projectRoot, resolved))
  return relativePath === '' ? '.' : relativePath
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

function parseRelationTargets(value: unknown): RelationTarget[] {
  if (!Array.isArray(value)) return []
  const VALID_MODES: readonly string[] = ['full', 'summary', 'reference']
  return value
    .filter((item): item is Record<string, unknown> =>
      typeof item === 'object' && item !== null
    )
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : '',
      mode: VALID_MODES.includes(item.mode as string)
        ? (item.mode as RelationTarget['mode'])
        : 'full',
    }))
    .filter((target): target is RelationTarget => target.id !== '')
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
  const fm = workflow?.frontmatter
  if (fm && 'conditional_phases' in fm) {
    return asStringArray(fm.conditional_phases)
  }
  return asStringArray(workflow?.frontmatter?.phases).filter(
    (phaseId) =>
      CONDITIONAL_PHASE_IDS.has(phaseId) || !REQUIRED_PHASE_IDS.has(phaseId)
  )
}

function evaluateConditionalPattern(
  document: HarnessDocument,
  inputPath: string,
): { matched: boolean; conditions: ConditionEvaluation[] } {
  const fm = document.frontmatter ?? {}
  if (textOf(fm.pattern) !== 'conditional') return { matched: true, conditions: [] }

  const conditions = recordOf(fm.conditions)
  const evaluations: ConditionEvaluation[] = []

  // Deterministic: path_any
  const pathAny = asStringArray(recordOf(conditions.deterministic).path_any)
  let pathMatched = pathAny.length === 0
  for (const pattern of pathAny) {
    if (matchesPathPattern(pattern, inputPath)) {
      pathMatched = true
      break
    }
  }
  if (pathAny.length > 0) {
    evaluations.push({
      type: 'deterministic',
      condition: `path_any: [${pathAny.join(', ')}]`,
      matched: pathMatched,
      method: 'mechanical',
    })
  }

  // Deterministic: tag_any
  const tagAny = asStringArray(recordOf(conditions.deterministic).tag_any)
  const docTags = new Set(asStringArray(document.frontmatter?.tags))
  let tagMatched = tagAny.length === 0
  for (const tag of tagAny) {
    if (docTags.has(tag)) {
      tagMatched = true
      break
    }
  }
  if (tagAny.length > 0) {
    evaluations.push({
      type: 'deterministic',
      condition: `tag_any: [${tagAny.join(', ')}]`,
      matched: tagMatched,
      method: 'mechanical',
    })
  }

  const deterministicMatched = pathMatched && tagMatched

  // Semantic conditions
  const semantic = recordOf(conditions.semantic)
  const taskIntentAny = asStringArray(semantic.task_intent_any)
  if (!deterministicMatched && taskIntentAny.length > 0) {
    evaluations.push({
      type: 'semantic',
      condition: `task_intent_any: [${taskIntentAny.join(', ')}]`,
      matched: false,
      method: 'llm',
      confidence: 'none',
    })
  }

  const matched = deterministicMatched
  return { matched, conditions: evaluations }
}

function resolveRelations(
  required: Map<string, { document: HarnessDocument; reasons: Set<string> }>,
  optional: Map<string, { document: HarnessDocument; reasons: Set<string> }>,
  documentsById: Map<string, HarnessDocument>,
  diagnostics: Diagnostic[],
): Array<{
  id: string | null
  path: string
  relations: RelationResolveTrace[]
}> {
  const relationTraces: Array<{
    id: string | null
    path: string
    relations: RelationResolveTrace[]
  }> = []

  const allSelected = new Set([...required.keys(), ...optional.keys()])
  const processed = new Set<string>()
  const worklist = [...allSelected]

  while (worklist.length > 0) {
    const relPath = worklist.shift()!
    if (processed.has(relPath)) continue
    processed.add(relPath)

    const entry = required.get(relPath) ?? optional.get(relPath)
    if (!entry) continue

    const document = entry.document
    const frontmatter = document.frontmatter ?? {}
    const pattern = textOf(frontmatter.pattern)
    const relations = recordOf(frontmatter.relations)
    const docId = idOf(document)
    const docRelations: RelationResolveTrace[] = []

    // --- Inheritance ---
    if (pattern === 'inheritance') {
      const inheritIds = asStringArray(relations.inherit)
      let maxDepth = 1
      for (const baseId of inheritIds) {
        const baseDoc = documentsById.get(baseId)
        if (!baseDoc) {
          docRelations.push({
            type: 'inherit',
            target: baseId,
            mode: 'full',
            resolved: false,
            reason: `Base '${baseId}' was not found`,
          })
          diagnostics.push({
            code: 'UNRESOLVED_ID_REFERENCE',
            severity: 'warning',
            path: document.relativePath,
            message: `Inheritance base '${baseId}' was not found.`,
          })
          continue
        }

        let depth = 1
        let current = baseDoc
        while (current.frontmatter?.pattern === 'inheritance') {
          const baseRelations = recordOf(current.frontmatter.relations)
          const baseInherits = asStringArray(baseRelations.inherit)
          if (baseInherits.length === 0) break
          const nextBase = documentsById.get(baseInherits[0])
          if (!nextBase) break
          current = nextBase
          depth++
        }
        maxDepth = Math.max(maxDepth, depth + 1)

        const baseTags = asStringArray(baseDoc.frontmatter?.tags)
        const childTags = asStringArray(document.frontmatter?.tags)
        const inheritedTags = baseTags.filter((t) => !childTags.includes(t))

        addSelected(required, baseDoc, `inherited base for '${docId}'`)
        worklist.push(baseDoc.relativePath)

        docRelations.push({
          type: 'inherit',
          target: baseId,
          mode: 'full',
          resolved: true,
          reason: 'Base injected before child for inheritance pattern',
          inheritedTags,
        })
      }

      if (maxDepth > 2) {
        diagnostics.push({
          code: 'INVALID_FRONTMATTER',
          severity: 'warning',
          path: document.relativePath,
          message: `Inheritance depth ${maxDepth} exceeds maximum of 2.`,
        })
      }
    }

    // --- require_context ---
    const requireCtxTargets = parseRelationTargets(relations.require_context)
    for (const target of requireCtxTargets) {
      const targetDoc = documentsById.get(target.id)
      if (!targetDoc) {
        docRelations.push({
          type: 'require_context',
          target: target.id,
          mode: target.mode,
          resolved: false,
          reason: `Target '${target.id}' was not found`,
        })
        diagnostics.push({
          code: 'UNRESOLVED_ID_REFERENCE',
          severity: 'warning',
          path: document.relativePath,
          message: `require_context target '${target.id}' was not found.`,
        })
        continue
      }

      if (target.mode === 'full') {
        addSelected(
          required,
          targetDoc,
          `require_context (full) for '${docId}'`,
        )
        worklist.push(targetDoc.relativePath)
        docRelations.push({
          type: 'require_context',
          target: target.id,
          mode: 'full',
          resolved: true,
          reason: 'Full context injected for require_context relation',
        })
      } else if (target.mode === 'summary') {
        addSelected(
          optional,
          targetDoc,
          `require_context (summary) for '${docId}'`,
        )
        worklist.push(targetDoc.relativePath)
        docRelations.push({
          type: 'require_context',
          target: target.id,
          mode: 'summary',
          resolved: true,
          reason: 'Summary mode: summary injection not implemented — included with full body as approximation',
        })
      } else if (target.mode === 'reference') {
        docRelations.push({
          type: 'require_context',
          target: target.id,
          mode: 'reference',
          resolved: true,
          reason: 'Reference mode: trace only, no body injection',
        })
      }
    }

    // --- require_constant ---
    const constValues = asStringArray(relations.require_constant)
    for (const constId of constValues) {
      const constDoc = documentsById.get(constId)
      if (!constDoc) {
        docRelations.push({
          type: 'require_constant',
          target: constId,
          mode: 'reference',
          resolved: false,
          reason: `Constant '${constId}' was not found`,
        })
        diagnostics.push({
          code: 'UNRESOLVED_ID_REFERENCE',
          severity: 'warning',
          path: document.relativePath,
          message: `require_constant target '${constId}' was not found.`,
        })
        continue
      }
      addSelected(optional, constDoc, `require_constant for '${docId}'`)
      worklist.push(constDoc.relativePath)
      docRelations.push({
        type: 'require_constant',
        target: constId,
        mode: 'reference',
        resolved: true,
        reason: 'Constant value reference',
      })
    }

    // --- require_decision ---
    const decisionIds = asStringArray(relations.require_decision)
    for (const decisionId of decisionIds) {
      const decisionDoc = documentsById.get(decisionId)
      if (!decisionDoc) {
        docRelations.push({
          type: 'require_decision',
          target: decisionId,
          mode: 'reference',
          resolved: false,
          reason: `Decision '${decisionId}' was not found`,
        })
        diagnostics.push({
          code: 'UNRESOLVED_ID_REFERENCE',
          severity: 'warning',
          path: document.relativePath,
          message: `require_decision target '${decisionId}' was not found.`,
        })
        continue
      }
      addSelected(optional, decisionDoc, `require_decision for '${docId}'`)
      worklist.push(decisionDoc.relativePath)
      docRelations.push({
        type: 'require_decision',
        target: decisionId,
        mode: 'reference',
        resolved: true,
        reason: 'Decision reference for condition evaluation',
      })
    }

    // --- conflicts ---
    const conflictIds = asStringArray(relations.conflicts)
    for (const conflictId of conflictIds) {
      const conflictDoc = documentsById.get(conflictId)
      if (!conflictDoc) continue
      if (allSelected.has(conflictDoc.relativePath) || required.has(conflictDoc.relativePath) || optional.has(conflictDoc.relativePath)) {
        docRelations.push({
          type: 'conflicts',
          target: conflictId,
          mode: 'full',
          resolved: true,
          reason: 'Both documents are selected; may require conflict resolution',
        })
        diagnostics.push({
          code: 'INVALID_FRONTMATTER',
          severity: 'info',
          path: document.relativePath,
          message: `Conflicts with selected document '${conflictId}'.`,
        })
      }
    }

    // --- related (trace only) ---
    const relatedIds = asStringArray(relations.related)
    for (const relatedId of relatedIds) {
      const relatedDoc = documentsById.get(relatedId)
      docRelations.push({
        type: 'related',
        target: relatedId,
        mode: 'reference',
        resolved: relatedDoc !== undefined,
        reason: relatedDoc
          ? 'Related knowledge (exploration hint, no auto-injection)'
          : `Related '${relatedId}' was not found`,
      })
    }

    if (docRelations.length > 0) {
      relationTraces.push({
        id: docId,
        path: document.relativePath,
        relations: docRelations,
      })
    }
  }

  return relationTraces
}

export function buildContextPlan(options: ContextPlanOptions): ContextPlan {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const inputPath = normalizedInputPath(projectRoot, options.inputPath)
  const roleIds = inferRoleIds(projectRoot, inputPath, options.roleIds)
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
    diagnostics.push(
      enrichMissingSymbolDiagnostic(
        {
          code: 'MISSING_WORKFLOW',
          severity: 'error',
          message: `Workflow '${options.workflowId}' was not found.`,
        },
        {
          requestedId: options.workflowId,
          documents,
          kind: 'workflow',
          workflowId: options.workflowId,
          roleIds,
          inputPath,
          intent: options.intent,
          mode,
        }
      )
    )
  } else {
    addSelected(required, workflow, 'requested workflow')
  }

  const roles = roleIds.map((roleId) => documentsById.get(roleId))
  for (let index = 0; index < roleIds.length; index += 1) {
    const roleId = roleIds[index]
    const role = roles[index]
    if (!role) {
      diagnostics.push(
        enrichMissingSymbolDiagnostic(
          {
            code: 'MISSING_ROLE',
            severity: 'error',
            message: `Role '${roleId}' was not found.`,
          },
          {
            requestedId: roleId,
            documents,
            kind: 'role',
            workflowId: options.workflowId,
            roleIds,
            inputPath,
            intent: options.intent,
            mode,
          }
        )
      )
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
    pattern?: string | null
    relations?: RelationResolveTrace[]
    affordances?: {
      declared: string[]
      inferred: string[]
      accepted: string[]
    }
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
        const cond = evaluateConditionalPattern(document, inputPath)
        // Add conditions to the last matching trace entry
        const matchingEntry = traceEntries.find(
          (te) => te.path === document.relativePath && te.reasons.some((r) => r.startsWith('selector matched'))
        )
        if (matchingEntry && cond.conditions.length > 0) {
          ;(matchingEntry as Record<string, unknown>).conditions = cond.conditions
        }
        if (!cond.matched) {
          addSkipped(skipped, document, document.relativePath, 'conditional pattern conditions not met')
          continue
        }
        if (documentHasAllTags(document, ['criticality:fatal', 'criticality:high'])) {
          addSelected(required, document, 'required by role selectors (high criticality)')
        } else {
          addSelected(optional, document, 'matched role selectors')
        }
        continue
      }

      if (!allMet || !anyMet) {
        traceSelectors(document, false, allMatch, anyMatch)
        // Record conditions even for non-matching selectors
        const cond = evaluateConditionalPattern(document, inputPath)
        if (cond.conditions.length > 0) {
          const entry = traceEntries.find((te) => te.path === document.relativePath)
          if (entry) {
            ;(entry as Record<string, unknown>).conditions = cond.conditions
          }
        }
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

  // Step 7: Relation Resolution — expand inheritance and require_context
  const relationTraces = resolveRelations(required, optional, documentsById, diagnostics)

  // Merge relation traces into selection trace entries
  for (const relTrace of relationTraces) {
    const existing = traceEntries.find(
      (te) => te.path === relTrace.path
    )
    if (existing) {
      (existing as Record<string, unknown>).relations = relTrace.relations
      ;(existing as Record<string, unknown>).pattern = null
      const doc = required.get(relTrace.path) ?? optional.get(relTrace.path)
      if (doc) {
        const fm = doc.document.frontmatter ?? {}
        ;(existing as Record<string, unknown>).pattern = textOf(fm.pattern) ?? null
      }
    } else {
      traceEntries.push({
        id: relTrace.id,
        path: relTrace.path,
        reasons: ['relation expansion'],
        selectorMatches: [],
        pattern: null,
        relations: relTrace.relations,
      })
    }
  }

  // Enrich all trace entries with pattern, affordances, and condition info
  function enrichTraceEntry(path: string, entry: { document: HarnessDocument; reasons: Set<string> }) {
    const fm = entry.document.frontmatter ?? {}
    const existing = traceEntries.find((te) => te.path === path)
    if (existing) {
      if (!existing.pattern) existing.pattern = textOf(fm.pattern) ?? null
      if (!(existing as Record<string, unknown>).affordances) {
        const declared = asStringArray(recordOf(fm.affordances).declared)
        const { suggested } = suggestAffordances(entry.document)
        ;(existing as Record<string, unknown>).affordances = {
          declared,
          inferred: suggested,
          accepted: [] as string[],
        }
      }
      return
    }
    const declared = asStringArray(recordOf(fm.affordances).declared)
    const { suggested } = suggestAffordances(entry.document)
    traceEntries.push({
      id: idOf(entry.document),
      path,
      reasons: [...entry.reasons],
      selectorMatches: [],
      pattern: textOf(fm.pattern) ?? null,
      affordances: {
        declared,
        inferred: suggested,
        accepted: [] as string[],
      },
    })
  }

  for (const [selPath] of required) {
    const entry = required.get(selPath)
    if (entry) enrichTraceEntry(selPath, entry)
  }
  for (const [selPath] of optional) {
    const entry = optional.get(selPath)
    if (entry) enrichTraceEntry(selPath, entry)
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
    roleIds,
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
    nextRenderCommand: buildContextRenderCommand({
      workflowId: options.workflowId,
      roleIds,
      inputPath,
      intent: options.intent,
      mode,
      documents,
    }),
    nextRunInitCommand: buildRunInitCommand({
      workflowId: options.workflowId,
      roleIds,
      inputPath,
      intent: options.intent,
      mode,
      documents,
    }),
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

export type SelectorV2PlanOptions = ContextPlanOptions & {
  selectorV2?: boolean
}

function computeEnvelopeFromGraph(projectRoot: string, roleId: string): { ownershipModes: string[]; allowedKinds: string[]; allowedPaths: string[] } {
  const graph = readGraph(projectRoot)
  if (!graph) return { ownershipModes: ['observed'], allowedKinds: [], allowedPaths: [] }

  const roleArtifacts = graph.artifacts.filter((a) => a.metadata?.ownerRole === roleId || a.ownership === 'observed')
  const ownershipModes = [...new Set(roleArtifacts.map((a) => a.ownership))]
  const allowedKinds = [...new Set(roleArtifacts.map((a) => a.kind))]
  const allowedPaths = [...new Set(roleArtifacts.map((a) => a.path).filter((p): p is string => !!p))]

  return { ownershipModes, allowedKinds, allowedPaths }
}

export function computePermissionEnvelope(projectRoot: string, roleIds: string[]): PermissionEnvelope[] {
  return roleIds.map((roleId) => {
    const envelope = computeEnvelopeFromGraph(projectRoot, roleId)
    return {
      roleId,
      ownershipModes: envelope.ownershipModes,
      allowedKinds: envelope.allowedKinds,
      allowedPaths: envelope.allowedPaths,
      sourceCount: envelope.allowedPaths.length,
    }
  })
}

export function buildGraphContextPlan(options: SelectorV2PlanOptions): ContextPlan {
  const base = buildContextPlan(options)
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const roleIds = options.roleIds
  const selectorV2Traces: SelectorV2Trace[] = []

  if (options.selectorV2) {
    const envelopes = computePermissionEnvelope(projectRoot, roleIds)
    for (const envelope of envelopes) {
      selectorV2Traces.push({
        type: 'permission',
        decision: `ownership: ${envelope.ownershipModes.join(', ') || 'none'}`,
        reason: `Role '${envelope.roleId}' has ${envelope.sourceCount} owned paths with modes [${envelope.ownershipModes.join(', ')}]`,
        sourceArtifacts: envelope.allowedPaths,
      })
    }

    selectorV2Traces.push({
      type: 'phase',
      decision: `required: ${base.required.filter((d) => d.kind === 'phase').length}, conditional: ${base.skipped.filter((s) => s.path.startsWith('phase.')).length}`,
      reason: `${base.required.filter((d) => d.kind === 'phase').length} required phases, ${base.skipped.filter((s) => s.path.startsWith('phase.')).length} conditional phases`,
      sourceArtifacts: base.required.filter((d) => d.kind === 'phase').map((d) => d.path),
    })

    selectorV2Traces.push({
      type: 'budget',
      decision: `${base.budgetEstimate.tokens}/${base.budgetEstimate.limit} tokens used`,
      reason: base.budgetEstimate.exceeded ? 'Budget exceeded' : 'Within budget',
      sourceArtifacts: [],
    })

    const traces = base.required.filter((d) => d.kind === 'role')
    for (const trace of traces) {
      selectorV2Traces.push({
        type: 'role',
        decision: `selected: ${trace.id}`,
        reason: trace.reasons.join('; '),
        sourceArtifacts: [trace.path],
      })
    }
  }

  return {
    ...base,
    selectorV2: options.selectorV2 ? { traces: selectorV2Traces } : undefined,
  }
}
