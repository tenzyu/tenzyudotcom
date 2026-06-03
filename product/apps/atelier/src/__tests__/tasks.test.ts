import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'bun:test'
import {
  createTask,
  splitTask,
  assignTask,
  taskStatus,
  closeTask,
  createRole,
  editRole,
} from '../core/tasks'
import { readEvents } from '../core/events'

const TEST_ROOT = '/tmp/atelier-tasks-test'

function setupTestProject() {
  rmSync(TEST_ROOT, { recursive: true, force: true })
  mkdirSync(TEST_ROOT, { recursive: true })

  mkdirSync(path.join(TEST_ROOT, '.harness/generated'), { recursive: true })
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/role-bundles.json'), '[]')
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/docs.json'), '[]')
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/ids.json'), '{}')
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/diagnostics.json'), '{}')
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/workflow-index.json'), '[]')
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/knowledge-index.json'), JSON.stringify({ byKnowledgeType: {}, byStatus: {}, byImpact: {}, byTag: {}, byScopePath: {} }))
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/path-ownership.json'), JSON.stringify({ entries: [] }))
  writeFileSync(path.join(TEST_ROOT, '.harness/generated/repo-map.json'), JSON.stringify({
    projects: [], files: [], ownershipHints: [], warnings: [],
    workspace: { packageManager: 'bun', taskRunner: 'nx', appsRoot: 'product/apps', packagesRoot: 'product/packages', harnessRoot: 'harness' },
  }))
}

describe('tasks module', () => {
  test('createTask creates a new task artifact', () => {
    setupTestProject()
    const task = createTask({
      projectRoot: TEST_ROOT,
      title: 'Implement login',
      description: 'Build the login component',
      phase: 'phase.implementation',
      scope: 'product/apps/web',
    })

    expect(task.id).toMatch(/^task\./)
    expect(task.title).toBe('Implement login')
    expect(task.description).toBe('Build the login component')
    expect(task.status).toBe('pending')
    expect(task.phase).toBe('phase.implementation')
    expect(task.scope).toBe('product/apps/web')
    expect(task.assignedRoles).toEqual([])
    expect(task.parentTask).toBeNull()
    expect(task.subtasks).toEqual([])
    expect(task.createdAt).toBeTruthy()
    expect(task.updatedAt).toBeTruthy()

    const filePath = path.join(TEST_ROOT, 'harness/tasks', `${task.id}.md`)
    expect(existsSync(filePath)).toBe(true)
  })

  test('createTask writes event log entry', () => {
    setupTestProject()
    createTask({ projectRoot: TEST_ROOT, title: 'Test event', description: 'Check event logging' })

    const events = readEvents(TEST_ROOT)
    const taskEvent = events.find((e) => e.kind === 'artifact_observed')
    expect(taskEvent).toBeDefined()
    expect(taskEvent!.payload.kind).toBe('task')
  })

  test('taskStatus returns task details', () => {
    setupTestProject()
    const task = createTask({ projectRoot: TEST_ROOT, title: 'Status check', description: 'Check status' })
    const result = taskStatus(TEST_ROOT, task.id)
    expect(result.exists).toBe(true)
    expect(result.task!.id).toBe(task.id)
    expect(result.task!.title).toBe('Status check')
    expect(result.task!.status).toBe('pending')
  })

  test('taskStatus returns exists=false for missing task', () => {
    setupTestProject()
    const result = taskStatus(TEST_ROOT, 'task.nonexistent')
    expect(result.exists).toBe(false)
    expect(result.task).toBeNull()
  })

  test('assignTask updates assigned roles', () => {
    setupTestProject()
    const task = createTask({ projectRoot: TEST_ROOT, title: 'Assign test', description: 'Test assignment' })
    const assigned = assignTask({ projectRoot: TEST_ROOT, taskId: task.id, roleIds: ['role.domain.web'], agent: 'bot' })

    expect(assigned.assignedRoles).toEqual(['role.domain.web'])
    expect(assigned.assignedAgent).toBe('bot')
  })

  test('closeTask completes a task', () => {
    setupTestProject()
    const task = createTask({ projectRoot: TEST_ROOT, title: 'Close test', description: 'Test closing' })
    const closed = closeTask(TEST_ROOT, task.id, 'completed')

    expect(closed.status).toBe('completed')
  })

  test('closeTask with cancelled outcome', () => {
    setupTestProject()
    const task = createTask({ projectRoot: TEST_ROOT, title: 'Cancel test', description: 'Test cancellation' })
    const cancelled = closeTask(TEST_ROOT, task.id, 'cancelled')

    expect(cancelled.status).toBe('cancelled')
  })

  test('splitTask creates subtasks', () => {
    setupTestProject()
    const parent = createTask({ projectRoot: TEST_ROOT, title: 'Parent', description: 'Parent task' })
    const children = splitTask({
      projectRoot: TEST_ROOT,
      taskId: parent.id,
      subtasks: [
        { title: 'Child 1', description: 'First subtask' },
        { title: 'Child 2', description: 'Second subtask' },
      ],
    })

    expect(children.length).toBe(2)
    expect(children[0]!.parentTask).toBe(parent.id)
    expect(children[1]!.parentTask).toBe(parent.id)

    const refreshed = taskStatus(TEST_ROOT, parent.id)
    expect(refreshed.task!.subtasks.length).toBe(2)
  })

  test('createRole writes a role markdown file', () => {
    setupTestProject()
    const roleId = createRole({
      projectRoot: TEST_ROOT,
      id: 'role.test.my-role',
      title: 'My Test Role',
      pinned: ['knowledge.repo-map'],
      requiredKnowledge: ['harness/knowledge/rules/security.md'],
    })

    expect(roleId).toBe('role.test.my-role')
    const filePath = path.join(TEST_ROOT, 'harness/actions/roles/role.test.my-role.md')
    expect(existsSync(filePath)).toBe(true)
  })

  test('createRole writes event log entry', () => {
    setupTestProject()
    createRole({ projectRoot: TEST_ROOT, id: 'role.test.event-role', title: 'Event Role' })
    const events = readEvents(TEST_ROOT)
    const roleEvent = events.find((e) => e.kind === 'artifact_observed' && e.payload.id === 'role.test.event-role')
    expect(roleEvent).toBeDefined()
  })

  test('editRole returns preview for existing role', () => {
    setupTestProject()
    createRole({ projectRoot: TEST_ROOT, id: 'role.test.preview-role', title: 'Preview Role' })
    const result = editRole(TEST_ROOT, 'role.test.preview-role', { title: 'Updated Title' })

    expect(result.role).not.toBeNull()
    expect(Array.isArray(result.preview)).toBe(true)
  })

  test('editRole returns null for missing role', () => {
    setupTestProject()
    const result = editRole(TEST_ROOT, 'role.nonexistent', {})

    expect(result.role).toBeNull()
    expect(result.preview[0]).toContain('not found')
  })

  test('createTask with custom assignedRoles and agent', () => {
    setupTestProject()
    const task = createTask({
      projectRoot: TEST_ROOT,
      title: 'Team task',
      description: 'Team assignment test',
      assignedRoles: ['role.domain.web', 'role.domain.api'],
      assignedAgent: 'agent-smith',
    })

    expect(task.assignedRoles).toEqual(['role.domain.web', 'role.domain.api'])
    expect(task.assignedAgent).toBe('agent-smith')
  })

  test('createTask with risk constraints and acceptance criteria', () => {
    setupTestProject()
    const task = createTask({
      projectRoot: TEST_ROOT,
      title: 'Risk-aware task',
      description: 'With constraints',
      riskConstraints: ['no-root-access', 'audit-log'],
      acceptanceCriteria: 'All tests pass',
    })

    expect(task.riskConstraints).toEqual(['no-root-access', 'audit-log'])
    expect(task.acceptanceCriteria).toBe('All tests pass')
  })
})
