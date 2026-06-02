import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { sha256Text } from './docs'
import { buildContextPreview, type ContextPreview, type ContextPreviewOptions } from './context'

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
