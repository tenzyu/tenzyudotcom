import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, sha256Text, toPosixPath } from './docs'
import { buildContextPreview, type ContextPreview, type ContextPreviewOptions } from './context'
import { parseFrontmatter } from './frontmatter'
import { runDoctor } from './doctor'
import { asStringArray, type Diagnostic, type HarnessDocument } from './schema'

export type RunInitOptions = ContextPreviewOptions & {
  runId?: string
}

export type RunInitResult = {
  runId: string
  runPath: string
  manifestPath: string
  contextPath: string
  briefPath: string
  preview: ContextPreview
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

type RunManifest = {
  runId?: unknown
  workflowId?: unknown
  roleIds?: unknown
  inputPath?: unknown
  selectedDocuments?: unknown
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

function deterministicRunId(options: ContextPreviewOptions) {
  const digest = sha256Text([options.workflowId, ...options.roleIds, options.inputPath, options.intent].join('\0')).slice(0, 10)
  return `RUN-${slug(options.inputPath)}-${slug(options.intent)}-${digest}`
}

function markdownList(items: readonly string[]) {
  if (items.length === 0) return '- None'
  return items.map((item) => `- ${item}`).join('\n')
}

function yamlString(value: string) {
  return JSON.stringify(value)
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
}

function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, 'utf-8'))
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function manifestDocuments(manifest: RunManifest): ManifestDocument[] {
  if (!Array.isArray(manifest.selectedDocuments)) return []
  return manifest.selectedDocuments
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

function renderContext(runId: string, preview: ContextPreview) {
  return [
    '---',
    'schema: harness/v1',
    'kind: run',
    `id: run.active.${runId.toLowerCase()}.context`,
    `title: ${yamlString(`${runId} Context`)}`,
    'status: active',
    `summary: ${yamlString(`Context manifest for ${preview.intent}`)}`,
    'tags:',
    '  - harness',
    '  - context',
    '---',
    '',
    `# Context: ${runId}`,
    '',
    '## Assignment',
    '',
    `- Workflow: \`${preview.workflowId}\``,
    `- Roles: ${preview.roleIds.map((roleId) => `\`${roleId}\``).join(', ')}`,
    `- Path: \`${preview.inputPath}\``,
    `- Intent: ${preview.intent}`,
    '',
    '## Exact Instructions',
    '',
    '- Read only the required context first.',
    '- Load optional context only when the reason matches the concrete task.',
    '- Keep edits scoped to the input path and selected role boundaries unless investigation proves a broader change is required.',
    '- Record verification evidence before claiming completion.',
    '- Update `handoff.md` with changed files, validation, risks, and follow-ups.',
    '',
    '## Required Context',
    '',
    markdownList(preview.required.map((document) => `\`${document.path}\` - ${document.reasons.join('; ')}`)),
    '',
    '## Optional Context',
    '',
    markdownList(preview.optional.map((document) => `\`${document.path}\` - ${document.reasons.join('; ')}`)),
    '',
    '## Skipped Context',
    '',
    markdownList(preview.skipped.slice(0, 80).map((document) => `\`${document.path}\` - ${document.reason}`)),
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
    markdownList(preview.diagnostics.map((diagnostic) => `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}`)),
    '',
    '## Closing Command',
    '',
    `\`atelier run close ${runId}\``,
  ].join('\n')
}

function manifest(runId: string, preview: ContextPreview) {
  return {
    runId,
    workflowId: preview.workflowId,
    roleIds: preview.roleIds,
    inputPath: preview.inputPath,
    intent: preview.intent,
    selectedDocuments: [...preview.required, ...preview.optional].map((document) => ({
      id: document.id,
      kind: document.kind,
      path: document.path,
      status: document.status,
      sha256: document.sha256,
      reasons: document.reasons,
      required: preview.required.some((required) => required.path === document.path),
    })),
    skippedDocuments: preview.skipped,
    diagnostics: preview.diagnostics,
    generatedAt: new Date().toISOString(),
    budgetEstimate: preview.budgetEstimate,
  }
}

export function initRun(options: RunInitOptions): RunInitResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const preview = buildContextPreview(options)
  const blockingDiagnostic = preview.diagnostics.find((diagnostic) => diagnostic.severity === 'error')
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
  writeFileSync(contextPath, `${renderContext(runId, preview)}\n`)
  writeFileSync(manifestPath, `${JSON.stringify(manifest(runId, preview), null, 2)}\n`)

  return {
    runId,
    runPath,
    manifestPath,
    contextPath,
    briefPath,
    preview,
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
