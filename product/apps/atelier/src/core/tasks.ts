import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { appendEvent, createEvent, createRunCompletedEvent, generateEventId } from './events'
import { loadHarnessDocuments } from './docs'
import type { HarnessDocument } from './schema'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'blocked'

export type TaskArtifact = {
  id: string
  title: string
  description: string
  status: TaskStatus
  phase: string
  scope: string
  assignedRoles: string[]
  assignedAgent: string | null
  acceptanceCriteria: string
  riskConstraints: string[]
  parentTask: string | null
  subtasks: string[]
  createdAt: string
  updatedAt: string
}

export type TaskCreateOptions = {
  projectRoot?: string
  title: string
  description: string
  phase?: string
  scope?: string
  assignedRoles?: string[]
  assignedAgent?: string | null
  acceptanceCriteria?: string
  riskConstraints?: string[]
  parentTask?: string | null
}

export type TaskSplitOptions = {
  projectRoot?: string
  taskId: string
  subtasks: TaskCreateOptions[]
}

export type TaskAssignOptions = {
  projectRoot?: string
  taskId: string
  roleIds?: string[]
  agent?: string | null
}

export type RoleCreateOptions = {
  projectRoot?: string
  id: string
  title: string
  selectors?: Record<string, unknown>
  pinned?: string[]
  requiredKnowledge?: string[]
  optionalKnowledge?: string[]
}

export type RoleEditOptions = {
  projectRoot?: string
  roleId: string
  changes: Partial<RoleCreateOptions>
}

function taskDir(projectRoot: string): string {
  return path.join(projectRoot, 'harness/tasks')
}

function taskFilePath(projectRoot: string, taskId: string): string {
  const sanitized = taskId.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
  return path.join(taskDir(projectRoot), `${sanitized}.md`)
}

function roleFilePath(projectRoot: string, roleId: string): string {
  const sanitized = roleId.replace(/[^a-z0-9._-]/gi, '-').toLowerCase()
  return path.join(projectRoot, `harness/actions/roles/${sanitized}.md`)
}

function frontmatterYaml(values: Record<string, unknown>): string {
  const lines: string[] = ['---', 'schema: harness/v1']
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      lines.push(`${key}:`)
      for (const item of value) {
        lines.push(`  - ${String(item)}`)
      }
    } else if (typeof value === 'object') {
      lines.push(`${key}:`)
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          lines.push(`  ${k}:`)
          for (const item of v) {
            lines.push(`    - ${String(item)}`)
          }
        } else {
          lines.push(`  ${k}: ${String(v)}`)
        }
      }
    } else {
      lines.push(`${key}: ${String(value)}`)
    }
  }
  lines.push('---', '')
  return lines.join('\n')
}

function currentTimestamp(): string {
  return new Date().toISOString()
}

export function createTask(options: TaskCreateOptions): TaskArtifact {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const taskId = `task.${generateEventId()}`
  const now = currentTimestamp()

  const task: TaskArtifact = {
    id: taskId,
    title: options.title,
    description: options.description,
    status: 'pending',
    phase: options.phase ?? 'unspecified',
    scope: options.scope ?? '.',
    assignedRoles: options.assignedRoles ?? [],
    assignedAgent: options.assignedAgent ?? null,
    acceptanceCriteria: options.acceptanceCriteria ?? '',
    riskConstraints: options.riskConstraints ?? [],
    parentTask: options.parentTask ?? null,
    subtasks: [],
    createdAt: now,
    updatedAt: now,
  }

  const dir = taskDir(projectRoot)
  mkdirSync(dir, { recursive: true })

  const fmData: Record<string, unknown> = {
    kind: 'task',
    id: taskId,
    title: task.title,
    status: task.status,
    phase: task.phase,
    scope: task.scope,
    assigned_roles: task.assignedRoles,
    assigned_agent: task.assignedAgent,
  }
  if (task.parentTask) fmData.parent_task = task.parentTask
  if (task.riskConstraints.length > 0) fmData.risk_constraints = task.riskConstraints

  const content = [
    frontmatterYaml(fmData),
    task.description,
    '',
    '## Acceptance Criteria',
    '',
    task.acceptanceCriteria || '_None specified._',
    '',
  ].join('\n')

  writeFileSync(taskFilePath(projectRoot, taskId), content)

  appendEvent(projectRoot, createEvent('artifact_observed', { id: taskId, kind: 'task', path: `harness/tasks/${taskId}.md` }, 'tasks.ts'))

  return task
}

export function splitTask(options: TaskSplitOptions): TaskArtifact[] {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const parent = readTask(projectRoot, options.taskId)
  if (!parent) throw new Error(`Task not found: ${options.taskId}`)

  const created: TaskArtifact[] = []
  for (const subOptions of options.subtasks) {
    const child = createTask({
      ...subOptions,
      projectRoot,
      parentTask: options.taskId,
    })
    created.push(child)

    parent.subtasks.push(child.id)

    appendEvent(projectRoot, createEvent('artifact_observed', { id: child.id, kind: 'task', parentTask: options.taskId }, 'tasks.ts'))
  }

  parent.updatedAt = currentTimestamp()
  writeTaskFile(projectRoot, parent)

  return created
}

export function assignTask(options: TaskAssignOptions): TaskArtifact {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const task = readTask(projectRoot, options.taskId)
  if (!task) throw new Error(`Task not found: ${options.taskId}`)

  if (options.roleIds) task.assignedRoles = options.roleIds
  if (options.agent !== undefined) task.assignedAgent = options.agent
  task.updatedAt = currentTimestamp()

  writeTaskFile(projectRoot, task)

  appendEvent(projectRoot, createEvent('artifact_edited', { id: task.id, kind: 'task', assignedRoles: task.assignedRoles, assignedAgent: task.assignedAgent }, 'tasks.ts'))

  return task
}

export function taskStatus(projectRoot: string, taskId: string): { task: TaskArtifact | null; exists: boolean } {
  const task = readTask(projectRoot, taskId)
  return { task, exists: task !== null }
}

export function closeTask(projectRoot: string, taskId: string, outcome?: 'completed' | 'cancelled'): TaskArtifact {
  const root = path.resolve(projectRoot)
  const task = readTask(root, taskId)
  if (!task) throw new Error(`Task not found: ${taskId}`)

  task.status = outcome ?? 'completed'
  task.updatedAt = currentTimestamp()

  writeTaskFile(root, task)

  appendEvent(root, createRunCompletedEvent(taskId, task.status === 'completed', 'tasks.ts'))

  return task
}

export function createRole(options: RoleCreateOptions): string {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const now = currentTimestamp()

  const fmData: Record<string, unknown> = {
    schema: 'harness/v1',
    kind: 'role',
    id: options.id,
    title: options.title,
    status: 'active',
    created_at: now,
  }

  if (options.selectors) fmData.selectors = options.selectors
  if (options.pinned && options.pinned.length > 0) fmData.pinned = options.pinned

  const lines: string[] = [frontmatterYaml(fmData)]

  lines.push(`# ${options.title}`, '')

  if (options.requiredKnowledge && options.requiredKnowledge.length > 0) {
    lines.push('## Required knowledge', '')
    for (const ref of options.requiredKnowledge) {
      lines.push(`- \`${ref}\``)
    }
    lines.push('')
  }

  if (options.optionalKnowledge && options.optionalKnowledge.length > 0) {
    lines.push('## Optional knowledge', '')
    for (const ref of options.optionalKnowledge) {
      lines.push(`- \`${ref}\``)
    }
    lines.push('')
  }

  const filePath = roleFilePath(projectRoot, options.id)
  mkdirSync(path.dirname(filePath), { recursive: true })
  writeFileSync(filePath, lines.join('\n'))

  appendEvent(projectRoot, createEvent('artifact_observed', { id: options.id, kind: 'role', path: path.relative(projectRoot, filePath) }, 'tasks.ts'))

  return options.id
}

export function editRole(projectRoot: string, roleId: string, changes: Partial<RoleCreateOptions>): { role: HarnessDocument | null; preview: string[] } {
  const root = path.resolve(projectRoot)
  const allDocs = loadHarnessDocuments(root)
  const roleDoc = allDocs.find((d) => d.frontmatter?.id === roleId && d.frontmatter?.kind === 'role')

  if (!roleDoc) {
    return { role: null, preview: [`Role not found: ${roleId}`] }
  }

  const preview: string[] = []
  if (changes.selectors) {
    preview.push(`selectors: ${JSON.stringify(changes.selectors)}`)
    const currentSelectors = roleDoc.frontmatter?.selectors
    const currentSelectorRecord = currentSelectors as Record<string, unknown> | undefined
    const currentTags = currentSelectorRecord?.tags
    const currentTagCount = Array.isArray(currentTags) ? (currentTags as string[]).length : 0
    const newTagCount = Array.isArray(changes.selectors.tags) ? (changes.selectors.tags as string[]).length : 0
    if (newTagCount > currentTagCount) {
      preview.push('[impact] Broader tag matching — more knowledge may be selected')
    }
    if (newTagCount < currentTagCount) {
      preview.push('[impact] Narrower tag matching — fewer knowledge may be selected')
    }
  }

  if (changes.pinned) {
    preview.push(`pinned: ${changes.pinned.join(', ')}`)
    const reindexHint = 'Re-run `atelier index` to refresh generated indexes'
    preview.push(`[impact] ${reindexHint}`)
  }

  if (changes.title) {
    preview.push(`title: ${changes.title}`)
  }

  return { role: roleDoc, preview }
}

function readTask(projectRoot: string, taskId: string): TaskArtifact | null {
  const filePath = taskFilePath(projectRoot, taskId)
  if (!existsSync(filePath)) return null

  try {
    const raw = readFileSync(filePath, 'utf-8')
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/)
    if (!fmMatch) return null

    const body = raw.slice(fmMatch[0].length).trim()
    const fmLines = fmMatch[1].split('\n')
    const fm: Record<string, unknown> = {}

    for (const line of fmLines) {
      const listMatch = line.match(/^\s{2}- (.+)$/)
      if (listMatch) {
        const lastKey = Object.keys(fm).pop()
        if (lastKey && Array.isArray(fm[lastKey])) {
          (fm[lastKey] as string[]).push(listMatch[1])
        }
        continue
      }
      const kvMatch = line.match(/^(\w+):\s*(.*)$/)
      if (kvMatch) {
        const key = kvMatch[1]
        const val = kvMatch[2].trim()
        fm[key] = val === '' ? [] : val
      }
    }

    const assignedRolesRaw = fm.assigned_roles
    const riskConstraintsRaw = fm.risk_constraints
    const subtasksRaw = fm.subtasks

    const task: TaskArtifact = {
      id: String(fm.id ?? taskId),
      title: String(fm.title ?? ''),
      description: body,
      status: (fm.status as TaskStatus) ?? 'pending',
      phase: String(fm.phase ?? 'unspecified'),
      scope: String(fm.scope ?? '.'),
      assignedRoles: Array.isArray(assignedRolesRaw) ? assignedRolesRaw as string[] : typeof assignedRolesRaw === 'string' ? [assignedRolesRaw] : [],
      assignedAgent: fm.assigned_agent ? String(fm.assigned_agent) : null,
      acceptanceCriteria: '',
      riskConstraints: Array.isArray(riskConstraintsRaw) ? riskConstraintsRaw as string[] : typeof riskConstraintsRaw === 'string' ? [riskConstraintsRaw] : [],
      parentTask: fm.parent_task ? String(fm.parent_task) : null,
      subtasks: Array.isArray(subtasksRaw) ? subtasksRaw as string[] : typeof subtasksRaw === 'string' ? [subtasksRaw] : [],
      createdAt: String(fm.created_at ?? fm.createdAt ?? ''),
      updatedAt: String(fm.updated_at ?? fm.updatedAt ?? ''),
    }

    return task
  } catch {
    return null
  }
}

function writeTaskFile(projectRoot: string, task: TaskArtifact): void {
  const fmData: Record<string, unknown> = {
    kind: 'task',
    id: task.id,
    title: task.title,
    status: task.status,
    phase: task.phase,
    scope: task.scope,
    assigned_roles: task.assignedRoles,
    assigned_agent: task.assignedAgent,
    parent_task: task.parentTask || undefined,
    subtasks: task.subtasks,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  }
  if (task.riskConstraints.length > 0) fmData.risk_constraints = task.riskConstraints

  const content = [
    frontmatterYaml(fmData),
    task.description,
    '',
    '## Acceptance Criteria',
    '',
    task.acceptanceCriteria || '_None specified._',
    '',
  ].join('\n')

  writeFileSync(taskFilePath(projectRoot, task.id), content)
}
