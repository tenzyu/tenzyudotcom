import { describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runCli } from '../cli'
import { buildGraphContextPlan } from '../core/context'
import { readEvents } from '../core/events'
import { createTask, closeTask } from '../core/tasks'
import { createRun, completeRun, resumeRun } from '../core/runs'

const removedCommands = [
  'atelier run init',
  'atelier run status',
  'atelier run close',
  'atelier context render',
  'atelier context expand',
  'atelier index',
  'atelier knowledge',
  'atelier repo map',
  'atelier repo owner',
  'atelier generate',
]

function writeMarkdown(root: string, relativePath: string, lines: string[]) {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

function setupProject() {
  const root = mkdtempSync(path.join(tmpdir(), 'atelier-contract-'))
  writeMarkdown(root, 'harness/actions/workflows/isolated-run.md', [
    '---',
    'schema: harness/v1',
    'kind: workflow',
    'id: workflow.isolated-run',
    'title: Isolated Run',
    'status: active',
    'phases:',
    '  - phase.intake',
    '  - phase.implementation',
    '  - phase.verification',
    '  - phase.handoff',
    '---',
    '# Isolated Run',
  ])
  writeMarkdown(root, 'harness/actions/phases/intake.md', ['---', 'schema: harness/v1', 'kind: phase', 'id: phase.intake', 'title: Intake', '---', '# Intake'])
  writeMarkdown(root, 'harness/actions/phases/implementation.md', ['---', 'schema: harness/v1', 'kind: phase', 'id: phase.implementation', 'title: Implementation', '---', '# Implementation'])
  writeMarkdown(root, 'harness/actions/phases/verification.md', ['---', 'schema: harness/v1', 'kind: phase', 'id: phase.verification', 'title: Verification', '---', '# Verification'])
  writeMarkdown(root, 'harness/actions/phases/handoff.md', ['---', 'schema: harness/v1', 'kind: phase', 'id: phase.handoff', 'title: Handoff', '---', '# Handoff'])
  writeMarkdown(root, 'harness/actions/roles/core/implementer.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.core.implementer',
    'title: Implementer',
    'status: active',
    '---',
    '# Implementer',
  ])
  writeMarkdown(root, 'harness/policies/repository.md', ['---', 'schema: harness/v1', 'kind: policy', 'id: policy.repository', 'title: Repository Policy', '---', '# Repository Policy'])
  return root
}

async function captureStdout(fn: () => Promise<unknown> | unknown) {
  const original = console.log
  const lines: string[] = []
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '))
  }
  try {
    await fn()
    return lines.join('\n')
  } finally {
    console.log = original
  }
}

describe('Atelier command contract', () => {
  test('context plan has read-only effects and no removed next commands', () => {
    const root = setupProject()
    try {
      const plan = buildGraphContextPlan({
        projectRoot: root,
        workflowId: 'workflow.isolated-run',
        roleIds: ['role.core.implementer'],
        inputPath: '.',
        intent: 'inspect contract',
        mode: 'compact',
      })

      expect(plan.surface).toBe('context')
      expect(plan.effects).toEqual({ mutated: false, createdRun: false, createdTask: false })
      expect(plan.nextActions).toEqual([])
      const serialized = JSON.stringify(plan)
      for (const command of removedCommands) expect(serialized).not.toContain(command)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('context plan human output has neutral footer and no removed commands', async () => {
    const root = setupProject()
    try {
      const output = await captureStdout(() => runCli([
        'context',
        'plan',
        '--project-root',
        root,
        '--workflow',
        'workflow.isolated-run',
        '--role',
        'role.core.implementer',
        '--path',
        '.',
        '--intent',
        'inspect contract',
      ]))
      expect(output).toContain('Context plan generated.')
      expect(output).toContain('No run capsule created.')
      expect(output).toContain('No task state mutated.')
      for (const command of removedCommands) expect(output).not.toContain(command)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('context plan --task includes task details', () => {
    const root = setupProject()
    try {
      const task = createTask({
        projectRoot: root,
        title: 'Contract task',
        description: 'Implement contract',
        phase: 'phase.implementation',
        scope: 'product/apps/atelier',
        assignedRoles: ['role.core.implementer'],
        acceptanceCriteria: 'Contract tests pass',
        riskConstraints: ['no legacy commands'],
      })
      const plan = buildGraphContextPlan({
        projectRoot: root,
        workflowId: 'workflow.isolated-run',
        roleIds: [],
        inputPath: '.',
        intent: 'fallback intent',
        taskId: task.id,
      })
      expect(plan.taskId).toBe(task.id)
      expect(plan.task?.title).toBe('Contract task')
      expect(plan.task?.scope).toBe('product/apps/atelier')
      expect(plan.task?.assignedRoles).toEqual(['role.core.implementer'])
      expect(plan.task?.acceptanceCriteria).toBe('Contract tests pass')
      expect(plan.task?.riskConstraints).toEqual(['no legacy commands'])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('task close emits task_closed and not run_completed', () => {
    const root = setupProject()
    try {
      const task = createTask({ projectRoot: root, title: 'Close contract', description: 'Close task' })
      closeTask(root, task.id, 'completed')
      const kinds = readEvents(root).map((event) => event.kind)
      expect(kinds).toContain('task_closed')
      expect(kinds).not.toContain('run_completed')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('run create materializes required files and emits only run_created', () => {
    const root = setupProject()
    try {
      const task = createTask({ projectRoot: root, title: 'Run contract', description: 'Create run capsule' })
      const run = createRun({ projectRoot: root, taskId: task.id })
      for (const file of ['manifest.json', 'brief.md', 'context.md', 'plan.md', 'handoff.md', 'worklog.md', 'verification.md', 'review.md', 'artifacts.md']) {
        expect(existsSync(path.join(root, 'harness/runs/active', run.id, file))).toBe(true)
      }
      const kinds = readEvents(root).map((event) => event.kind)
      expect(kinds).toContain('run_created')
      expect(kinds).not.toContain('run_started')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('historical run_started events can still be read', () => {
    const root = setupProject()
    try {
      mkdirSync(path.join(root, 'harness/atelier'), { recursive: true })
      writeFileSync(path.join(root, 'harness/atelier/events.ndjson'), JSON.stringify({ id: 'legacy', timestamp: new Date().toISOString(), kind: 'run_started', payload: { runId: 'RUN-legacy' }, source: 'legacy' }) + '\n')
      expect(readEvents(root).map((event) => event.kind)).toContain('run_started')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('run resume reports path and reading order', () => {
    const root = setupProject()
    try {
      const task = createTask({ projectRoot: root, title: 'Resume contract', description: 'Resume run capsule' })
      const run = createRun({ projectRoot: root, taskId: task.id })
      const resume = resumeRun(root, run.id)
      expect(resume.runPath).toContain(`harness/runs/active/${run.id}`)
      expect(resume.readingOrder).toEqual(['manifest.json', 'brief.md', 'context.md', 'plan.md', 'handoff.md', 'worklog.md', 'verification.md', 'review.md', 'artifacts.md'])
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test('run complete emits run_completed and moves capsule', () => {
    const root = setupProject()
    try {
      const task = createTask({ projectRoot: root, title: 'Complete contract', description: 'Complete run capsule' })
      const run = createRun({ projectRoot: root, taskId: task.id })
      const completed = completeRun(root, run.id)
      expect(completed.status).toBe('completed')
      expect(existsSync(path.join(root, 'harness/runs/completed', run.id, 'manifest.json'))).toBe(true)
      const kinds = readEvents(root).map((event) => event.kind)
      expect(kinds).toContain('run_completed')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
