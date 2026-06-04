import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildGraphContextPlan } from './context'
import { appendEvent, createRunCompletedEvent, createRunCreatedEvent, generateEventId } from './events'
import { taskStatus } from './tasks'

export type RunStatus = 'active' | 'completed'

export type RunCapsuleManifest = {
  schema: 'atelier/run-capsule/v1'
  id: string
  status: RunStatus
  taskId: string
  title: string
  intent: string
  scope: string
  workflowId: string
  roleIds: string[]
  createdAt: string
  updatedAt: string
  artifactRefs: string[]
  validationRefs: string[]
  contextHash: string
  worktree: {
    projectRoot: string
  }
}

export type RunCapsule = RunCapsuleManifest & {
  path: string
}

export type CreateRunOptions = {
  projectRoot?: string
  taskId: string
  workflowId?: string
  roleIds?: string[]
}

export type ResumeRunResult = {
  runId: string
  runPath: string
  readingOrder: string[]
  prompt: string
}

export type VerificationRecord = {
  checkId: string
  status: string
  note: string
  recordedAt: string
}

const REQUIRED_FILES = [
  'manifest.json',
  'brief.md',
  'context.md',
  'plan.md',
  'handoff.md',
  'worklog.md',
  'verification.md',
  'review.md',
  'artifacts.md',
]

export function requiredRunFiles(): string[] {
  return [...REQUIRED_FILES]
}

function now() {
  return new Date().toISOString()
}

function runsRoot(projectRoot: string, status: RunStatus) {
  return path.join(projectRoot, 'harness/runs', status === 'active' ? 'active' : 'completed')
}

function activeRunPath(projectRoot: string, runId: string) {
  return path.join(runsRoot(projectRoot, 'active'), runId)
}

function completedRunPath(projectRoot: string, runId: string) {
  return path.join(runsRoot(projectRoot, 'completed'), runId)
}

function resolveRunPath(projectRoot: string, runId: string) {
  const active = activeRunPath(projectRoot, runId)
  if (existsSync(active)) return active
  const completed = completedRunPath(projectRoot, runId)
  if (existsSync(completed)) return completed
  throw new Error(`Run not found: ${runId}`)
}

function readManifest(runPath: string): RunCapsuleManifest {
  const manifestPath = path.join(runPath, 'manifest.json')
  if (!existsSync(manifestPath)) throw new Error(`Run manifest not found: ${manifestPath}`)
  return JSON.parse(readFileSync(manifestPath, 'utf-8')) as RunCapsuleManifest
}

function writeManifest(runPath: string, manifest: RunCapsuleManifest) {
  writeFileSync(path.join(runPath, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
}

function writeRunFile(runPath: string, file: string, content: string) {
  writeFileSync(path.join(runPath, file), content.endsWith('\n') ? content : `${content}\n`)
}

export function createRun(options: CreateRunOptions): RunCapsule {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const taskResult = taskStatus(projectRoot, options.taskId)
  if (!taskResult.task) throw new Error(`Task not found: ${options.taskId}`)

  const task = taskResult.task
  const runId = `RUN-${generateEventId()}`
  const runPath = activeRunPath(projectRoot, runId)
  mkdirSync(runPath, { recursive: true })

  const workflowId = options.workflowId ?? 'workflow.isolated-run'
  const roleIds = options.roleIds && options.roleIds.length > 0 ? options.roleIds : task.assignedRoles
  const createdAt = now()
  const contextPlan = buildGraphContextPlan({
    projectRoot,
    workflowId,
    roleIds,
    inputPath: task.scope,
    intent: task.title,
    taskId: task.id,
    mode: 'compact',
  })
  const contextSnapshot = JSON.stringify(contextPlan, null, 2)

  const manifest: RunCapsuleManifest = {
    schema: 'atelier/run-capsule/v1',
    id: runId,
    status: 'active',
    taskId: task.id,
    title: task.title,
    intent: task.description || task.title,
    scope: task.scope,
    workflowId,
    roleIds,
    createdAt,
    updatedAt: createdAt,
    artifactRefs: [],
    validationRefs: [],
    contextHash: Bun.hash(contextSnapshot).toString(16),
    worktree: {
      projectRoot,
    },
  }

  writeManifest(runPath, manifest)
  writeRunFile(runPath, 'brief.md', `# ${task.title}\n\n${task.description}\n\nScope: ${task.scope}\nTask: ${task.id}\n`)
  writeRunFile(runPath, 'context.md', `# Context Snapshot\n\n\`\`\`json\n${contextSnapshot}\n\`\`\`\n`)
  writeRunFile(runPath, 'plan.md', '# Plan\n\n- [ ] Inspect context\n- [ ] Implement task\n- [ ] Verify changes\n')
  writeRunFile(runPath, 'handoff.md', '# Handoff\n\nNo handoff updates recorded yet.\n')
  writeRunFile(runPath, 'worklog.md', `# Worklog\n\n- ${createdAt}: Run capsule created.\n`)
  writeRunFile(runPath, 'verification.md', '# Verification\n\nNo verification records yet.\n')
  writeRunFile(runPath, 'review.md', '# Review\n\nNo review notes yet.\n')
  writeRunFile(runPath, 'artifacts.md', '# Artifacts\n\nNo artifact notes yet.\n')

  appendEvent(projectRoot, createRunCreatedEvent(runId, task.id, 'runs.ts'))

  return { ...manifest, path: path.relative(projectRoot, runPath) }
}

export function inspectRun(projectRoot: string, runId: string): RunCapsule {
  const root = path.resolve(projectRoot)
  const runPath = resolveRunPath(root, runId)
  return { ...readManifest(runPath), path: path.relative(root, runPath) }
}

export function listRuns(projectRoot: string): RunCapsule[] {
  const root = path.resolve(projectRoot)
  const runDirs = (status: RunStatus) => {
    const dir = runsRoot(root, status)
    if (!existsSync(dir)) return []
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(dir, entry.name))
  }
  return [...runDirs('active'), ...runDirs('completed')]
    .filter((runPath) => existsSync(path.join(runPath, 'manifest.json')))
    .map((runPath) => ({ ...readManifest(runPath), path: path.relative(root, runPath) }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}

export function resumeRun(projectRoot: string, runId: string): ResumeRunResult {
  const root = path.resolve(projectRoot)
  const runPath = resolveRunPath(root, runId)
  const relativePath = path.relative(root, runPath)
  return {
    runId,
    runPath: relativePath,
    readingOrder: requiredRunFiles(),
    prompt: `Resume run ${runId}. Read files in order from ${relativePath}: ${requiredRunFiles().join(', ')}.`,
  }
}

export function appendRunHandoff(projectRoot: string, runId: string, text: string): RunCapsule {
  const root = path.resolve(projectRoot)
  const runPath = resolveRunPath(root, runId)
  const manifest = readManifest(runPath)
  if (manifest.status !== 'active') throw new Error(`Run is not active: ${runId}`)
  writeFileSync(path.join(runPath, 'handoff.md'), `\n${now()}: ${text}\n`, { flag: 'a' })
  manifest.updatedAt = now()
  writeManifest(runPath, manifest)
  return { ...manifest, path: path.relative(root, runPath) }
}

export function listRunVerification(projectRoot: string, runId: string): VerificationRecord[] {
  const runPath = resolveRunPath(path.resolve(projectRoot), runId)
  const filePath = path.join(runPath, 'verification.records.json')
  if (!existsSync(filePath)) return []
  return JSON.parse(readFileSync(filePath, 'utf-8')) as VerificationRecord[]
}

export function recordRunVerification(projectRoot: string, runId: string, checkId: string, status: string, note: string): VerificationRecord[] {
  const root = path.resolve(projectRoot)
  const runPath = resolveRunPath(root, runId)
  const manifest = readManifest(runPath)
  if (manifest.status !== 'active') throw new Error(`Run is not active: ${runId}`)
  const records = listRunVerification(root, runId)
  records.push({ checkId, status, note, recordedAt: now() })
  writeFileSync(path.join(runPath, 'verification.records.json'), `${JSON.stringify(records, null, 2)}\n`)
  writeFileSync(path.join(runPath, 'verification.md'), `\n- ${checkId}: ${status} - ${note}\n`, { flag: 'a' })
  manifest.validationRefs = [...new Set([...manifest.validationRefs, checkId])]
  manifest.updatedAt = now()
  writeManifest(runPath, manifest)
  return records
}

export function completeRun(projectRoot: string, runId: string): RunCapsule {
  const root = path.resolve(projectRoot)
  const runPath = activeRunPath(root, runId)
  if (!existsSync(runPath)) throw new Error(`Active run not found: ${runId}`)
  for (const file of REQUIRED_FILES) {
    if (!existsSync(path.join(runPath, file))) throw new Error(`Run completion blocked: missing ${file}`)
  }
  const manifest = readManifest(runPath)
  manifest.status = 'completed'
  manifest.updatedAt = now()
  writeManifest(runPath, manifest)

  const completedPath = completedRunPath(root, runId)
  mkdirSync(path.dirname(completedPath), { recursive: true })
  renameSync(runPath, completedPath)
  appendEvent(root, createRunCompletedEvent(runId, true, 'runs.ts'))
  return { ...manifest, path: path.relative(root, completedPath) }
}
