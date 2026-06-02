import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, sha256Text, toPosixPath } from './docs'
import {
  buildContextPlan,
  normalizeContextMode,
  type ContextMode,
  type ContextPlan,
  type ContextPlanOptions,
  type SelectedContextDocument,
} from './context'
import { parseFrontmatter } from './frontmatter'
import { runDoctor } from './doctor'
import { asStringArray, type Diagnostic, type HarnessDocument } from './schema'

export type RunInitOptions = ContextPlanOptions & {
  runId?: string
}

export type RunInitResult = {
  runId: string
  runPath: string
  manifestPath: string
  contextPath: string
  briefPath: string
  plan: ContextPlan
}

export type ContextRenderOptions = ContextPlanOptions & {
  runId?: string
}

export type ContextRenderResult = {
  runId: string
  runPath: string
  context: string
  manifest: ReturnType<typeof manifest>
  plan: ContextPlan
}

export type RunCloseOptions = {
  projectRoot?: string
  runId: string
}

export type RunCloseResult = {
  ok: boolean
  runId: string
  runPath: string
  completedPath: string
  moved: boolean
  alreadyClosed: boolean
  nonTrivial: boolean
  reviewRequired: boolean
  diagnostics: Diagnostic[]
}

export type ContextExpandOptions = {
  projectRoot?: string
  runId: string
  reference: string
}

export type ContextExpandResult = {
  runId: string
  runPath: string
  contextPath: string
  manifestPath: string
  expandedDocument: SelectedContextDocument
  alreadyExpanded: boolean
}

type RunManifest = {
  runId?: unknown
  workflowId?: unknown
  roleIds?: unknown
  inputPath?: unknown
  contextMode?: unknown
  selectedDocuments?: unknown
  expandedDocuments?: unknown
}

type ManifestDocument = {
  path: string
  sha256: string
}

function slug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return normalized || 'run'
}

function deterministicRunId(options: ContextPlanOptions) {
  const digest = sha256Text([options.workflowId, ...options.roleIds, options.inputPath, options.intent].join('\0')).slice(0, 10)
  return `RUN-${slug(options.inputPath)}-${slug(options.intent)}-${digest}`
}

function markdownList(items: readonly string[]) {
  if (items.length === 0) return '- None'
  return items.map((item) => `- ${item}`).join('\n')
}

function documentId(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function yamlString(value: string) {
  return JSON.stringify(value)
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
}

function byDocumentPath(documents: HarnessDocument[]) {
  return new Map(documents.map((document) => [document.relativePath, document] as const))
}

function resolveSelectedDocument(
  selected: SelectedContextDocument,
  documentsByPath: Map<string, HarnessDocument>,
) {
  return documentsByPath.get(selected.path)
}

function truncate(value: string, limit: number) {
  if (value.length <= limit) return value
  return `${value.slice(0, limit).trimEnd()}\n\n[Excerpt truncated. Expand the source when this task needs more detail.]`
}

function extractHeadingSections(body: string, headings: readonly string[]) {
  const wanted = new Set(headings.map((heading) => heading.toLowerCase()))
  const lines = body.split(/\r?\n/)
  const sections: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]?.match(/^(#{1,6})\s+(.+)$/)
    if (!match?.[1] || !match[2]) continue
    const heading = match[2].trim().toLowerCase()
    if (!wanted.has(heading)) continue

    const level = match[1].length
    const section = [lines[index]]
    for (const line of lines.slice(index + 1)) {
      const next = line.match(/^(#{1,6})\s+(.+)$/)
      if (next?.[1] && next[1].length <= level) break
      section.push(line)
    }
    sections.push(section.join('\n').trim())
  }

  return sections.join('\n\n').trim()
}

function compactDocumentBody(document: HarnessDocument) {
  const kind = textOf(document.frontmatter?.kind)
  const body = document.body.trim()
  const preferred =
    kind === 'role'
      ? extractHeadingSections(body, ['Mission', 'Primary scope', 'Forbidden default scope', 'Outputs', 'Review criteria'])
      : kind === 'workflow'
        ? extractHeadingSections(body, ['Purpose', 'Completion standard'])
        : kind === 'policy'
          ? extractHeadingSections(body, ['Rules', 'Core boundaries', 'Standard checks', 'Broad Validation'])
          : kind === 'knowledge'
            ? extractHeadingSections(body, ['Rule', 'Rules', 'Requirements', 'Required behavior', 'Implementation Notes', 'Completion standard'])
            : ''

  return truncate((preferred || body || document.raw).trim(), 2200)
}

function fullDocumentBody(document: HarnessDocument) {
  return truncate((document.body.trim() || document.raw).trim(), 12_000)
}

function renderCompiledDocument(
  selected: SelectedContextDocument,
  document: HarnessDocument | undefined,
  mode: ContextMode,
) {
  const title = selected.title ?? selected.id ?? selected.path
  const source = [
    `Source: \`${selected.path}\``,
    selected.id ? `ID: \`${selected.id}\`` : null,
    `Reason: ${selected.reasons.join('; ')}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n')

  if (mode === 'linked') {
    return [`### ${title}`, '', source, '', 'Expand this source only when the task needs more detail.'].join('\n')
  }

  if (!document) {
    return [`### ${title}`, '', source, '', 'Selected source was not available while rendering this context pack.'].join('\n')
  }

  const compiled = mode === 'full' ? fullDocumentBody(document) : compactDocumentBody(document)
  return [`### ${title}`, '', source, '', 'Compiled context:', '', '```md', compiled, '```'].join('\n')
}

function recommendedVerification(inputPath: string) {
  const app = inputPath.match(/^product\/apps\/([^/]+)/)?.[1]
  if (!app) {
    return ['bun nx affected -t check', 'bun run policy:deps']
  }
  return [`bun nx run ${app}:check`, `bun nx run ${app}:build`, 'bun run policy:deps when the change is broad']
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function manifestDocuments(manifest: RunManifest): ManifestDocument[] {
  const rawDocuments = [
    ...(Array.isArray(manifest.selectedDocuments) ? manifest.selectedDocuments : []),
    ...(Array.isArray(manifest.expandedDocuments) ? manifest.expandedDocuments : []),
  ]
  return rawDocuments
    .map((document) => {
      if (document === null || typeof document !== 'object') return null
      const record = document as Record<string, unknown>
      const documentPath = textOf(record.path)
      const sha256 = textOf(record.sha256)
      if (!documentPath || !sha256) return null
      return { path: documentPath, sha256 }
    })
    .filter((document): document is ManifestDocument => document !== null)
}

function manifestRecord(filePath: string): RunManifest {
  return readJsonFile(filePath) as RunManifest
}

function artifactPath(runPath: string, artifact: string) {
  return path.join(runPath, artifact)
}

function artifactExists(runPath: string, artifact: string) {
  return existsSync(artifactPath(runPath, artifact))
}

function readArtifact(runPath: string, artifact: string) {
  const target = artifactPath(runPath, artifact)
  return existsSync(target) ? readFileSync(target, 'utf-8') : ''
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) return listMarkdownFiles(target)
    return entry.isFile() && entry.name.endsWith('.md') ? [target] : []
  })
}

function isOpenKnowledgeProposal(filePath: string) {
  const parsed = parseFrontmatter(readFileSync(filePath, 'utf-8'))
  if (parsed.frontmatter?.kind !== 'knowledge-proposal') return false
  return parsed.frontmatter.status !== 'archived'
}

function relevantDoctorError(diagnostic: Diagnostic, runRelativePath: string, selectedPaths: Set<string>) {
  if (diagnostic.severity !== 'error' || !diagnostic.path) return false
  return diagnostic.path.startsWith(`${runRelativePath}/`) || selectedPaths.has(diagnostic.path)
}

function documentById(documents: HarnessDocument[]) {
  return new Map(
    documents
      .map((document) => {
        const id = textOf(document.frontmatter?.id)
        return id ? ([id, document] as const) : null
      })
      .filter((entry): entry is readonly [string, HarnessDocument] => entry !== null),
  )
}

function resolveDocumentReference(projectRoot: string, reference: string, documents: HarnessDocument[]) {
  const byId = documentById(documents)
  const byPath = byDocumentPath(documents)
  const clean = reference.replace(/^['"]|['"]$/g, '').replace(/\/$/, '')
  const relative = path.isAbsolute(clean) ? toPosixPath(path.relative(projectRoot, clean)) : clean
  return byId.get(clean) ?? byPath.get(relative) ?? byPath.get(`${relative}.md`)
}

function selectedFromDocument(document: HarnessDocument, reasons: string[]): SelectedContextDocument {
  return {
    id: documentId(document),
    kind: textOf(document.frontmatter?.kind),
    path: document.relativePath,
    title: textOf(document.frontmatter?.title),
    status: textOf(document.frontmatter?.status),
    sha256: document.sha256,
    reasons,
    tokenEstimate: Math.ceil(document.raw.length / 4),
  }
}

function renderExpandedContext(document: SelectedContextDocument, source: HarnessDocument, mode: ContextMode) {
  return [
    '',
    `## Expanded Context: ${document.title ?? document.id ?? document.path}`,
    '',
    renderCompiledDocument(document, source, mode),
  ].join('\n')
}

function workflowRequiresReview(projectRoot: string, workflowId: string | null) {
  if (!workflowId) return false
  const documentsById = documentById(loadHarnessDocuments(projectRoot))
  const workflow = documentsById.get(workflowId)
  return asStringArray(workflow?.frontmatter?.phases).includes('phase.review')
}

function artifactsRequireReview(content: string) {
  return /(security[- ]sensitive files changed|public api changed|broad refactor|review required)\s*:?\s*(yes|true|required)/i.test(content)
}

function hasUnjustifiedSkippedChecks(verification: string) {
  return verification.split(/\r?\n/).some((line) => {
    if (/^\s*#/.test(line)) return false
    if (!/\bskip(?:ped)?\b/i.test(line)) return false
    if (/\b(none|n\/a|not applicable)\b/i.test(line)) return false
    return !/\b(reason|justification|because|deferred|owner approved)\b/i.test(line)
  })
}

function renderBrief(runId: string, options: RunInitOptions) {
  return [
    '---',
    'schema: harness/v1',
    'kind: run',
    `id: run.active.${runId.toLowerCase()}.brief`,
    `title: ${yamlString(`${runId} Brief`)}`,
    'status: active',
    `summary: ${yamlString(options.intent)}`,
    'tags:',
    '  - harness',
    '  - run',
    '---',
    '',
    `# Brief: ${runId}`,
    '',
    '## Intent',
    '',
    options.intent,
    '',
    '## Inputs',
    '',
    `- Workflow: \`${options.workflowId}\``,
    `- Roles: ${options.roleIds.map((roleId) => `\`${roleId}\``).join(', ')}`,
    `- Path: \`${options.inputPath}\``,
    '',
    '## Scope',
    '',
    'TBD by executor after reading `context.md`.',
  ].join('\n')
}

function renderLinkedContext(plan: ContextPlan) {
  return [
    '## Required Context',
    '',
    markdownList(plan.required.map((document) => `\`${document.path}\` - ${document.reasons.join('; ')}`)),
    '',
    '## Optional Context',
    '',
    markdownList(plan.optional.map((document) => `\`${document.path}\` - ${document.reasons.join('; ')}`)),
    '',
    '## Skipped Context',
    '',
    markdownList(plan.skipped.slice(0, 80).map((document) => `\`${document.path}\` - ${document.reason}`)),
  ].join('\n')
}

function renderContext(projectRoot: string, runId: string, runPath: string, plan: ContextPlan) {
  const documentsByPath = byDocumentPath(loadHarnessDocuments(projectRoot))
  const mode = normalizeContextMode(plan.mode)
  const requiredContext =
    mode === 'linked'
      ? renderLinkedContext(plan)
      : plan.required
          .map((selected) => renderCompiledDocument(selected, resolveSelectedDocument(selected, documentsByPath), mode))
          .join('\n\n')

  return [
    '---',
    'schema: harness/v1',
    'kind: run',
    `id: run.active.${runId.toLowerCase()}.context`,
    `title: ${yamlString(`${runId} Context`)}`,
    'status: active',
    `summary: ${yamlString(`Compiled context pack for ${plan.intent}`)}`,
    'tags:',
    '  - harness',
    '  - context',
    '---',
    '',
    `# Context: ${runId}`,
    '',
    '## Agent Contract',
    '',
    '- Read this file first and use it as the initial working context pack.',
    '- Do not manually scan `harness/knowledge/**` before following this context.',
    '- Read additional files only when this context says to expand, investigation proves this pack is insufficient, or a command/error references uncovered context.',
    '- When expanding context, run `atelier context expand <RUN-ID> <DOC-ID-OR-PATH>` when possible and record the reason in `worklog.md`.',
    '',
    '## Run',
    '',
    `- Workflow: \`${plan.workflowId}\``,
    `- Roles: ${plan.roleIds.map((roleId) => `\`${roleId}\``).join(', ')}`,
    `- Target path: \`${plan.inputPath}\``,
    `- Intent: ${plan.intent}`,
    `- Context mode: \`${mode}\``,
    '',
    '## Scope',
    '',
    'Allowed by default:',
    '',
    markdownList([plan.inputPath, toPosixPath(path.relative(projectRoot, runPath))].map((allowed) => `\`${allowed}\``)),
    '',
    'Forbidden by default:',
    '',
    markdownList([
      'unrelated product apps or packages',
      'dependency changes unless the task requires them',
      'broad harness restructuring outside this run',
      'completed run history unless diagnosing a repeated harness problem',
    ]),
    '',
    '## Compiled Required Context',
    '',
    requiredContext || '- None',
    '',
    '## Expansion Policy',
    '',
    'Optional sources are not embedded by default. Expand only when their reason matches the concrete task.',
    '',
    markdownList(plan.optional.map((document) => `\`${document.path}\` - ${document.reasons.join('; ')}`)),
    '',
    'Skipped sources:',
    '',
    markdownList(plan.skipped.slice(0, 80).map((document) => `\`${document.path}\` - ${document.reason}`)),
    '',
    '## Investigation Steps',
    '',
    '- Identify the concrete files and exported surfaces involved.',
    '- Check whether selected constraints apply before editing.',
    '- Record findings and any context expansion in `worklog.md`.',
    '- Update `brief.md` or `plan.md` before expanding scope materially.',
    '',
    '## Implementation Steps',
    '',
    '- Keep edits scoped to the target path and assigned role boundaries.',
    '- Preserve repository dependency boundaries and local project conventions.',
    '- Avoid unrelated refactors.',
    '- Record verification evidence before claiming completion.',
    '',
    '## Verification',
    '',
    markdownList(recommendedVerification(plan.inputPath).map((command) => `\`${command}\``)),
    '',
    '## Required Artifacts',
    '',
    '- `brief.md`',
    '- `context.md`',
    '- `context.manifest.json`',
    '- `worklog.md` for non-trivial implementation notes',
    '- `verification.md`',
    '- `handoff.md`',
    '',
    '## Diagnostics',
    '',
    markdownList(plan.diagnostics.map((diagnostic) => `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`)),
    '',
    '## Closing Command',
    '',
    `\`atelier run close ${runId}\``,
  ].join('\n')
}

function manifest(runId: string, plan: ContextPlan) {
  return {
    runId,
    workflowId: plan.workflowId,
    roleIds: plan.roleIds,
    inputPath: plan.inputPath,
    intent: plan.intent,
    contextMode: plan.mode,
    selectedDocuments: [...plan.required, ...plan.optional].map((document) => ({
      id: document.id,
      kind: document.kind,
      path: document.path,
      status: document.status,
      sha256: document.sha256,
      reasons: document.reasons,
      required: plan.required.some((required) => required.path === document.path),
    })),
    expandedDocuments: [],
    skippedDocuments: plan.skipped,
    diagnostics: plan.diagnostics,
    generatedAt: new Date().toISOString(),
    budgetEstimate: plan.budgetEstimate,
  }
}

export function renderContextForOptions(options: ContextRenderOptions): ContextRenderResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const plan = buildContextPlan(options)
  const blockingDiagnostic = plan.diagnostics.find((diagnostic) => diagnostic.severity === 'error')
  if (blockingDiagnostic) {
    throw new Error(`${blockingDiagnostic.code}: ${blockingDiagnostic.message}`)
  }

  const runId = options.runId ?? deterministicRunId(options)
  const runPath = path.join(projectRoot, 'harness/runs/active', runId)

  return {
    runId,
    runPath,
    context: renderContext(projectRoot, runId, runPath, plan),
    manifest: manifest(runId, plan),
    plan,
  }
}

export function initRun(options: RunInitOptions): RunInitResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const plan = buildContextPlan(options)
  const blockingDiagnostic = plan.diagnostics.find((diagnostic) => diagnostic.severity === 'error')
  if (blockingDiagnostic) {
    throw new Error(`${blockingDiagnostic.code}: ${blockingDiagnostic.message}`)
  }
  const runId = options.runId ?? deterministicRunId(options)
  const runPath = path.join(projectRoot, 'harness/runs/active', runId)

  if (existsSync(runPath)) {
    throw new Error(`Run already exists: harness/runs/active/${runId}`)
  }

  mkdirSync(runPath, { recursive: true })

  const briefPath = path.join(runPath, 'brief.md')
  const contextPath = path.join(runPath, 'context.md')
  const manifestPath = path.join(runPath, 'context.manifest.json')

  writeFileSync(briefPath, `${renderBrief(runId, options)}\n`)
  writeFileSync(contextPath, `${renderContext(projectRoot, runId, runPath, plan)}\n`)
  writeFileSync(manifestPath, `${JSON.stringify(manifest(runId, plan), null, 2)}\n`)

  return {
    runId,
    runPath,
    manifestPath,
    contextPath,
    briefPath,
    plan,
  }
}

export function expandRunContext(options: ContextExpandOptions): ContextExpandResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const runPath = path.join(projectRoot, 'harness/runs/active', options.runId)
  if (!existsSync(runPath)) {
    throw new Error(`Active run was not found: harness/runs/active/${options.runId}`)
  }

  const manifestPath = artifactPath(runPath, 'context.manifest.json')
  const contextPath = artifactPath(runPath, 'context.md')
  if (!existsSync(manifestPath)) {
    throw new Error(`Run context manifest is missing: harness/runs/active/${options.runId}/context.manifest.json`)
  }
  if (!existsSync(contextPath)) {
    throw new Error(`Run context file is missing: harness/runs/active/${options.runId}/context.md`)
  }

  const documents = loadHarnessDocuments(projectRoot)
  const source = resolveDocumentReference(projectRoot, options.reference, documents)
  if (!source) {
    throw new Error(`Context expansion source was not found: ${options.reference}`)
  }

  const currentManifest = manifestRecord(manifestPath)
  const mode = normalizeContextMode(textOf(currentManifest.contextMode) ?? undefined)
  const selected = selectedFromDocument(source, [`expanded by command for run '${options.runId}'`])
  const alreadyExpanded = manifestDocuments(currentManifest).some((document) => document.path === selected.path)

  if (!alreadyExpanded) {
    const expandedDocuments = Array.isArray(currentManifest.expandedDocuments) ? [...currentManifest.expandedDocuments] : []
    expandedDocuments.push({
      id: selected.id,
      kind: selected.kind,
      path: selected.path,
      status: selected.status,
      sha256: selected.sha256,
      reasons: selected.reasons,
      required: false,
      expandedAt: new Date().toISOString(),
    })
    writeFileSync(manifestPath, `${JSON.stringify({ ...currentManifest, expandedDocuments }, null, 2)}\n`)
    writeFileSync(contextPath, `${readFileSync(contextPath, 'utf-8').trimEnd()}\n${renderExpandedContext(selected, source, mode)}\n`)
  }

  const worklogPath = artifactPath(runPath, 'worklog.md')
  if (existsSync(worklogPath)) {
    const expansionLine = `- Expanded context \`${selected.path}\` via \`atelier context expand ${options.runId} ${options.reference}\`.`
    const current = readFileSync(worklogPath, 'utf-8')
    if (!current.includes(expansionLine)) {
      const separator = current.includes('## Context Expansions') ? '\n' : '\n\n## Context Expansions\n\n'
      writeFileSync(worklogPath, `${current.trimEnd()}${separator}${expansionLine}\n`)
    }
  }

  return {
    runId: options.runId,
    runPath,
    contextPath,
    manifestPath,
    expandedDocument: selected,
    alreadyExpanded,
  }
}

export function closeRun(options: RunCloseOptions): RunCloseResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const activePath = path.join(projectRoot, 'harness/runs/active', options.runId)
  const completedPath = path.join(projectRoot, 'harness/runs/completed', options.runId)
  const alreadyClosed = !existsSync(activePath) && existsSync(completedPath)
  const runPath = alreadyClosed ? completedPath : activePath
  const runRelativePath = toPosixPath(path.relative(projectRoot, runPath))
  const diagnostics: Diagnostic[] = []

  if (!existsSync(runPath)) {
    diagnostics.push({
      code: 'MISSING_RUN_ARTIFACT',
      severity: 'error',
      message: `Run was not found under harness/runs/active or harness/runs/completed: ${options.runId}`,
    })
    return {
      ok: false,
      runId: options.runId,
      runPath,
      completedPath,
      moved: false,
      alreadyClosed: false,
      nonTrivial: true,
      reviewRequired: false,
      diagnostics,
    }
  }

  const manifestPath = artifactPath(runPath, 'context.manifest.json')
  let manifest: RunManifest = {}
  if (!existsSync(manifestPath)) {
    diagnostics.push({
      code: 'MISSING_RUN_ARTIFACT',
      severity: 'error',
      path: toPosixPath(path.relative(projectRoot, manifestPath)),
      message: 'Required run artifact is missing: context.manifest.json',
    })
  } else {
    try {
      manifest = readJsonFile(manifestPath) as RunManifest
    } catch (error) {
      diagnostics.push({
        code: 'INVALID_FRONTMATTER',
        severity: 'error',
        path: toPosixPath(path.relative(projectRoot, manifestPath)),
        message: `Invalid context manifest JSON: ${error instanceof Error ? error.message : String(error)}`,
      })
    }
  }

  const workflowId = textOf(manifest.workflowId)
  const roleIds = asStringArray(manifest.roleIds)
  const nonTrivial = workflowId !== 'workflow.direct-run'
  const requiredArtifacts = nonTrivial
    ? ['brief.md', 'context.md', 'context.manifest.json', 'verification.md', 'handoff.md']
    : ['context.manifest.json']

  for (const artifact of requiredArtifacts) {
    if (artifactExists(runPath, artifact)) continue
    diagnostics.push({
      code: 'MISSING_RUN_ARTIFACT',
      severity: 'error',
      path: toPosixPath(path.relative(projectRoot, artifactPath(runPath, artifact))),
      message: `Required run artifact is missing: ${artifact}`,
    })
  }

  const selectedDocuments = manifestDocuments(manifest)
  for (const document of selectedDocuments) {
    if (!isSha256(document.sha256)) {
      diagnostics.push({
        code: 'CONTEXT_HASH_MISMATCH',
        severity: 'error',
        path: document.path,
        message: `Selected context document has no valid sha256 recorded: ${document.path}`,
      })
      continue
    }

    const currentPath = path.join(projectRoot, document.path)
    if (!existsSync(currentPath)) {
      diagnostics.push({
        code: 'CONTEXT_HASH_MISMATCH',
        severity: 'warning',
        path: document.path,
        message: `Selected context document no longer exists: ${document.path}`,
      })
      continue
    }

    const currentHash = sha256Text(readFileSync(currentPath, 'utf-8'))
    if (currentHash !== document.sha256) {
      diagnostics.push({
        code: 'CONTEXT_HASH_MISMATCH',
        severity: 'warning',
        path: document.path,
        message: `Selected context document changed since run init: ${document.path}`,
        details: {
          expected: document.sha256,
          actual: currentHash,
        },
      })
    }
  }

  if (nonTrivial && artifactExists(runPath, 'verification.md') && hasUnjustifiedSkippedChecks(readArtifact(runPath, 'verification.md'))) {
    diagnostics.push({
      code: 'RUN_SKIPPED_CHECK_UNJUSTIFIED',
      severity: 'error',
      path: toPosixPath(path.relative(projectRoot, artifactPath(runPath, 'verification.md'))),
      message: 'Verification mentions skipped checks without a clear justification.',
    })
  }

  const artifactText = ['brief.md', 'worklog.md', 'verification.md', 'handoff.md']
    .map((artifact) => readArtifact(runPath, artifact))
    .join('\n')
  const reviewRequired =
    workflowRequiresReview(projectRoot, workflowId) ||
    roleIds.includes('role.core.reviewer') ||
    artifactsRequireReview(artifactText)

  if (reviewRequired && !artifactExists(runPath, 'review.md')) {
    diagnostics.push({
      code: 'RUN_REVIEW_REQUIRED',
      severity: 'error',
      path: toPosixPath(path.relative(projectRoot, artifactPath(runPath, 'review.md'))),
      message: 'This run requires review evidence, but review.md is missing.',
    })
  }

  const proposalRoot = path.join(runPath, 'knowledge-proposals')
  const openProposals = listMarkdownFiles(proposalRoot).filter(isOpenKnowledgeProposal)
  for (const proposalPath of openProposals) {
    diagnostics.push({
      code: 'RUN_KNOWLEDGE_PROPOSAL_OPEN',
      severity: 'error',
      path: toPosixPath(path.relative(projectRoot, proposalPath)),
      message: 'Knowledge proposal is still open; promote, reject, or archive it before closing the run.',
    })
  }

  const selectedPaths = new Set(selectedDocuments.map((document) => document.path))
  for (const diagnostic of runDoctor({ projectRoot }).diagnostics) {
    if (!relevantDoctorError(diagnostic, runRelativePath, selectedPaths)) continue
    diagnostics.push({
      ...diagnostic,
      message: `Doctor error affects this run: ${diagnostic.message}`,
    })
  }

  const ok = diagnostics.every((diagnostic) => diagnostic.severity !== 'error')
  let moved = false
  if (ok && !alreadyClosed) {
    if (existsSync(completedPath)) {
      diagnostics.push({
        code: 'MISSING_RUN_ARTIFACT',
        severity: 'error',
        path: toPosixPath(path.relative(projectRoot, completedPath)),
        message: `Completed run path already exists: harness/runs/completed/${options.runId}`,
      })
    } else {
      mkdirSync(path.dirname(completedPath), { recursive: true })
      renameSync(activePath, completedPath)
      moved = true
    }
  }

  return {
    ok: ok && diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    runId: options.runId,
    runPath,
    completedPath,
    moved,
    alreadyClosed,
    nonTrivial,
    reviewRequired,
    diagnostics,
  }
}
