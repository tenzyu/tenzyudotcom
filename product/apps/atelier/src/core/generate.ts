import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments } from './docs'
import { compileIndexes } from './indexer'
import { asStringArray, type Diagnostic, type HarnessDocument } from './schema'

export type GenerateOptions = {
  projectRoot?: string
  write?: boolean
}

export type GeneratedFileKind =
  | 'skill-atelier'
  | 'skill-workflow'
  | 'skill-role'
  | 'adapter-root'

export type GeneratedFile = {
  path: string
  absolutePath: string
  kind: GeneratedFileKind
  content: string
}

export type GenerateResult = {
  ok: boolean
  generatedRoot: string
  adapterRoot: string
  files: GeneratedFile[]
  diagnostics: Diagnostic[]
  nextCommands: string[]
}

const ROOT_ADAPTERS = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'] as const

type RootAdapter = (typeof ROOT_ADAPTERS)[number]

const ROOT_ADAPTER_TOOL: Record<RootAdapter, string> = {
  'AGENTS.md': 'harness/adapters/tool/AGENTS.md',
  'CLAUDE.md': 'harness/adapters/tool/CLAUDE.md',
  'GEMINI.md': 'harness/adapters/tool/GEMINI.md',
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
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

function yamlString(value: string) {
  return JSON.stringify(value)
}

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function shortId(id: string) {
  const segments = id.split('.')
  return segments[segments.length - 1] ?? id
}

function extractSection(body: string, heading: string) {
  const lines = body.split(/\r?\n/)
  const start = lines.findIndex(
    (line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`
  )
  if (start === -1) return ''
  const section: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+/.test(line)) break
    section.push(line)
  }
  return section.join('\n').trim()
}

function renderAtelierSkill(generatedAt: string): string {
  return [
    '---',
    'schema: harness/v1',
    'kind: generated-skill',
    'id: skill.atelier',
    'title: Atelier Skill',
    'status: active',
    'summary: How agents use Atelier instead of manually scanning the harness.',
    'tags:',
    '  - harness',
    '  - skill',
    '  - atelier',
    `generated_at: ${yamlString(generatedAt)}`,
    '---',
    '',
    '# Atelier',
    '',
    'Do not manually discover harness context first.',
    '',
    '## Default Protocol',
    '',
    '1. Run `atelier run init --workflow isolated-run --intent "<request>"`.',
    '2. Read the generated `harness/runs/active/<RUN-ID>/context.md`.',
    '3. Follow the workflow, role, and phase instructions inside `context.md`.',
    '4. Update `verification.md` and `handoff.md` as the run progresses.',
    '5. Run `atelier run close <RUN-ID>` before claiming completion.',
    '',
    '## Core Commands',
    '',
    '```bash',
    'atelier doctor         # Inspect harness Markdown for corruption.',
    'atelier index          # Refresh generated indexes.',
    'atelier index --check  # Fail when generated indexes are stale.',
    'atelier context plan   # Plan selected context without creating a run.',
    'atelier context render # Render a context pack without creating a run.',
    'atelier run init       # Materialize a context pack into a run.',
    'atelier run close      # Enforce the completion gate for a run.',
    'atelier knowledge propose  # Create a knowledge proposal from run evidence.',
    'atelier knowledge promote  # Promote a validated proposal into durable knowledge.',
    'atelier id rename OLD NEW  # Rename a symbolic id across the harness.',
    'atelier generate           # Refresh generated skills and root adapters.',
    '```',
    '',
    '## Knowledge Updates',
    '',
    'Small direct edits to existing knowledge are allowed when the correction is narrow and obvious.',
    'New durable knowledge should go through `atelier knowledge propose` so promotion stays reviewable.',
    '',
    '## Fallback',
    '',
    'If Atelier is unavailable, manually start with `harness/canon/model.md`, `harness/policies/repository.md`, and the smallest relevant role file.',
    'Record the fallback in `worklog.md`.',
  ].join('\n')
}

function renderWorkflowSkill(
  document: HarnessDocument,
  generatedAt: string
): string {
  const id = idOf(document) ?? ''
  const title = textOf(document.frontmatter?.title) || shortId(id)
  const summary = textOf(document.frontmatter?.summary)
  const useWhen = asStringArray(document.frontmatter?.use_when)
  const phases = asStringArray(document.frontmatter?.phases)
  const requiredPhases = asStringArray(document.frontmatter?.required_phases)
  const conditionalPhases = asStringArray(
    document.frontmatter?.conditional_phases
  )
  const purpose = extractSection(document.body, 'Purpose') ||
    extractSection(document.body, 'Description')
  const completion = extractSection(document.body, 'Completion standard')

  const lines: string[] = [
    '---',
    'schema: harness/v1',
    'kind: generated-skill',
    `id: skill.workflow.${shortId(id)}`,
    `title: ${yamlString(`${title} Workflow Skill`)}`,
    'status: active',
    `summary: ${yamlString(summary || `Use Atelier to call ${id}.`)}`,
    'tags:',
    '  - harness',
    '  - skill',
    '  - workflow',
    `workflow_id: ${yamlString(id)}`,
    `generated_at: ${yamlString(generatedAt)}`,
    '---',
    '',
    `# Skill: ${id}`,
    '',
    '## When to call',
    '',
  ]
  if (useWhen.length > 0) {
    for (const condition of useWhen) lines.push(`- ${condition}`)
  } else if (purpose) {
    lines.push(purpose)
  } else {
    lines.push(`Call this workflow for tasks described by \`${id}\`.`)
  }
  lines.push('', '## Required commands', '')
  lines.push('1. `atelier run init --workflow ' + id + ' --role <ROLE> --path <PATH> --intent "<INTENT>"`.')
  lines.push('2. Read the generated `harness/runs/active/<RUN-ID>/context.md`.')
  lines.push('3. `atelier run close <RUN-ID>` after `verification.md` and `handoff.md` are complete.')
  lines.push('', '## Phases', '')
  if (phases.length === 0) {
    lines.push('- None recorded')
  } else {
    for (const phase of phases) lines.push(`- \`${phase}\``)
  }
  if (requiredPhases.length > 0 || conditionalPhases.length > 0) {
    lines.push('', '## Phase Discipline', '')
    if (requiredPhases.length > 0) {
      lines.push('Required:')
      for (const phase of requiredPhases) lines.push(`- \`${phase}\``)
    }
    if (conditionalPhases.length > 0) {
      lines.push('')
      lines.push('Conditional:')
      for (const phase of conditionalPhases) lines.push(`- \`${phase}\``)
    }
  }
  if (completion) {
    lines.push('', '## Completion Standard', '', completion)
  }
  return lines.join('\n')
}

function renderRoleSkill(document: HarnessDocument, generatedAt: string): string {
  const id = idOf(document) ?? ''
  const title = textOf(document.frontmatter?.title) || shortId(id)
  const summary = textOf(document.frontmatter?.summary)
  const mission = extractSection(document.body, 'Mission')
  const primaryScope = extractSection(document.body, 'Primary scope')
  const forbiddenScope = extractSection(document.body, 'Forbidden default scope')
  const outputs = extractSection(document.body, 'Outputs')
  const reviewCriteria = extractSection(document.body, 'Review criteria')
  const pinned = asStringArray(document.frontmatter?.pinned)
  const activation = recordOf(document.frontmatter?.activation)
  const activationPaths = asStringArray(activation.paths)
  const activationUseWhen = asStringArray(activation.use_when)

  const lines: string[] = [
    '---',
    'schema: harness/v1',
    'kind: generated-skill',
    `id: skill.role.${shortId(id)}`,
    `title: ${yamlString(`${title} Role Skill`)}`,
    'status: active',
    `summary: ${yamlString(summary || `Use Atelier to load ${id}.`)}`,
    'tags:',
    '  - harness',
    '  - skill',
    '  - role',
    `role_id: ${yamlString(id)}`,
    `generated_at: ${yamlString(generatedAt)}`,
    '---',
    '',
    `# Skill: ${id}`,
    '',
    '## Activation',
    '',
  ]
  if (activationUseWhen.length > 0) {
    for (const condition of activationUseWhen) lines.push(`- ${condition}`)
  } else if (mission) {
    lines.push(mission)
  } else {
    lines.push(`Load this role for work that needs \`${id}\`.`)
  }
  if (activationPaths.length > 0) {
    lines.push('', 'Activation paths:')
    for (const value of activationPaths) lines.push(`- \`${value}\``)
  }
  if (pinned.length > 0) {
    lines.push('', '## Pinned Context', '')
    for (const value of pinned) lines.push(`- \`${value}\``)
  }
  if (primaryScope) {
    lines.push('', '## Primary Scope', '', primaryScope)
  }
  if (forbiddenScope) {
    lines.push('', '## Forbidden Default Scope', '', forbiddenScope)
  }
  lines.push('', '## Commands', '')
  lines.push('1. `atelier run init --workflow <WF> --role ' + id + ' --path <PATH> --intent "<INTENT>"`.')
  lines.push('2. Read the generated `harness/runs/active/<RUN-ID>/context.md`.')
  lines.push('3. `atelier run close <RUN-ID>` after `verification.md` and `handoff.md` are complete.')
  if (outputs) lines.push('', '## Outputs', '', outputs)
  if (reviewCriteria) lines.push('', '## Review Criteria', '', reviewCriteria)
  return lines.join('\n')
}

function renderRootAdapter(adapter: RootAdapter, generatedAt: string): string {
  const id = `adapter.root.${adapter.replace(/\.md$/, '').toLowerCase()}`
  const titleCase = adapter === 'AGENTS.md' ? 'AGENTS' : adapter.replace(/\.md$/, '')
  const toolSource = ROOT_ADAPTER_TOOL[adapter]
  const description =
    adapter === 'AGENTS.md'
      ? 'Root Codex-style adapter that routes agents through Atelier.'
      : adapter === 'CLAUDE.md'
        ? 'Root Claude adapter that routes work through Atelier.'
        : 'Root Gemini adapter that routes work through Atelier.'

  return [
    '---',
    'schema: harness/v1',
    'kind: adapter',
    `id: ${id}`,
    `title: ${yamlString(`Root ${titleCase} Adapter`)}`,
    'status: active',
    `summary: ${yamlString(description)}`,
    'tags:',
    '  - harness',
    '  - adapter',
    '  - root',
    `generated: true`,
    `generator: atelier generate`,
    `tool_source: ${yamlString(toolSource)}`,
    `generated_at: ${yamlString(generatedAt)}`,
    '---',
    '',
    `# ${adapter}`,
    '',
    'Do not manually discover harness context first.',
    '',
    'Use Atelier.',
    '',
    '```bash',
    'atelier run init --workflow isolated-run --intent "<request>"',
    '```',
    '',
    'Read `harness/runs/active/<RUN-ID>/context.md`.',
    '',
    '```bash',
    'atelier run close <RUN-ID>',
    '```',
    '',
    'Stable knowledge lives in `harness/`. Root adapters stay short and route agents into Atelier.',
  ].join('\n')
}

function buildGeneratedFiles(
  projectRoot: string,
  documents: HarnessDocument[]
): GeneratedFile[] {
  const generatedRoot = path.join(projectRoot, '.harness/generated')
  const generatedAt = new Date().toISOString()
  const skillsRoot = path.join(generatedRoot, 'skills')
  const files: GeneratedFile[] = []

  files.push({
    path: '.harness/generated/skills/atelier.md',
    absolutePath: path.join(skillsRoot, 'atelier.md'),
    kind: 'skill-atelier',
    content: `${renderAtelierSkill(generatedAt)}\n`,
  })

  for (const document of documents) {
    if (document.frontmatter?.kind !== 'workflow') continue
    const id = idOf(document)
    if (!id) continue
    const fileName = `${shortId(id)}.md`
    files.push({
      path: `.harness/generated/skills/workflows/${fileName}`,
      absolutePath: path.join(skillsRoot, 'workflows', fileName),
      kind: 'skill-workflow',
      content: `${renderWorkflowSkill(document, generatedAt)}\n`,
    })
  }

  for (const document of documents) {
    if (document.frontmatter?.kind !== 'role') continue
    const id = idOf(document)
    if (!id) continue
    const fileName = `${shortId(id)}.md`
    files.push({
      path: `.harness/generated/skills/roles/${fileName}`,
      absolutePath: path.join(skillsRoot, 'roles', fileName),
      kind: 'skill-role',
      content: `${renderRoleSkill(document, generatedAt)}\n`,
    })
  }

  for (const adapter of ROOT_ADAPTERS) {
    files.push({
      path: `harness/adapters/root/${adapter}`,
      absolutePath: path.join(projectRoot, 'harness/adapters/root', adapter),
      kind: 'adapter-root',
      content: `${renderRootAdapter(adapter, generatedAt)}\n`,
    })
  }

  return files
}

function isUnchanged(target: string, content: string) {
  if (!existsSync(target)) return false
  return readFileSync(target, 'utf-8') === content
}

export function generateGeneratedFiles(
  options: GenerateOptions = {}
): GenerateResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const write = options.write === true
  const diagnostics: Diagnostic[] = []

  const generatedRoot = path.join(projectRoot, '.harness/generated')
  const adapterRoot = path.join(projectRoot, 'harness/adapters/root')

  if (!existsSync(path.join(projectRoot, 'harness'))) {
    diagnostics.push({
      code: 'MISSING_RUN_ARTIFACT',
      severity: 'error',
      message: 'Harness directory does not exist; cannot generate skills and adapters.',
    })
    return {
      ok: false,
      generatedRoot,
      adapterRoot,
      files: [],
      diagnostics,
      nextCommands: [],
    }
  }

  const harnessFiles = loadHarnessDocuments(projectRoot)
  const documents: HarnessDocument[] = harnessFiles.filter(
    (document) =>
      !document.relativePath.startsWith('harness/legacy/') &&
      !document.relativePath.startsWith('harness/runs/completed/') &&
      !document.relativePath.startsWith('harness/runs/active/')
  )

  const files = buildGeneratedFiles(projectRoot, documents)
  const nextCommands: string[] = []

  if (write) {
    for (const file of files) {
      if (isUnchanged(file.absolutePath, file.content)) continue
      mkdirSync(path.dirname(file.absolutePath), { recursive: true })
      writeFileSync(file.absolutePath, file.content)
    }
    compileIndexes({ projectRoot, write: true })
    nextCommands.push('atelier index --check', 'atelier doctor')
  } else {
    nextCommands.push('atelier generate --write')
  }

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    generatedRoot,
    adapterRoot,
    files,
    diagnostics,
    nextCommands,
  }
}
