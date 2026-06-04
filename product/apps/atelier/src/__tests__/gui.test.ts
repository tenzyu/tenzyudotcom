import { afterAll, afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startGuiServer } from '../core/gui-server'
import { handleGuiRequest } from '../core/gui'
import { createTask } from '../core/tasks'

const PROJECT_ROOT = mkdtempSync(path.join(tmpdir(), 'atelier-gui-'))

function writeMarkdown(relativePath: string, lines: string[]) {
  const target = path.join(PROJECT_ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

function seed() {
  writeMarkdown('harness/actions/workflows/isolated-run.md', [
    '---',
    'schema: harness/v1',
    'kind: workflow',
    'id: workflow.isolated-run',
    'title: Isolated Run',
    'status: active',
    'callable: true',
    'phases:',
    '  - phase.intake',
    '---',
    '# Isolated Run',
  ])
  writeMarkdown('harness/actions/roles/domain/harness-engineer.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.domain.harness-engineer',
    'title: Harness Engineer',
    'status: active',
    'selectors:',
    '  paths:',
    '    - product/apps/atelier/**',
    '---',
    '# Harness Engineer',
  ])
  writeMarkdown('harness/policies/repository.md', [
    '---',
    'schema: harness/v1',
    'kind: policy',
    'id: policy.repository',
    'title: Repository Policy',
    'status: active',
    '---',
    '# Repository Policy',
  ])
  writeMarkdown('product/apps/atelier/package.json', [
    '{',
    '  "name": "atelier-fixture",',
    '  "version": "0.0.0"',
    '}',
  ])
}

async function fetchFromServer(
  server: ReturnType<typeof startGuiServer>,
  path: string,
  init?: { method?: string; body?: unknown }
) {
  const url = `http://${server.host}:${server.port}${path}`
  const response = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
  })
  const text = await response.text()
  return { status: response.status, json: text ? safeJson(text) : null, text }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

describe('GUI HTTP API', () => {
  let server: ReturnType<typeof startGuiServer> | null = null

  beforeEach(() => {
    seed()
  })

  afterEach(() => {
    server?.stop()
    server = null
  })

  afterAll(() => {
    server?.stop()
    rmSync(PROJECT_ROOT, { recursive: true, force: true })
  })

  test('serves the index page', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetch(`http://${server.host}:${server.port}/`)
    expect(response.status).toBe(200)
    const body = await response.text()
    expect(body).toContain('<title>Atelier</title>')
  })

  test('GET /api/doctor returns a doctor report', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/doctor')
    expect(response.status).toBe(200)
    expect(response.json?.summary).toBeDefined()
    expect(Array.isArray(response.json?.diagnostics)).toBe(true)
  })

  test('handleGuiRequest handles unknown routes', () => {
    const response = handleGuiRequest(
      { method: 'GET', pathname: '/api/missing' },
      '',
      { projectRoot: PROJECT_ROOT, allowMutations: false }
    )
    expect(response.status).toBe(404)
  })

  test('Run Capsules API creates and lists runs', () => {
    const task = createTask({ projectRoot: PROJECT_ROOT, title: 'GUI run', description: 'Create GUI run' })
    const created = handleGuiRequest(
      { method: 'POST', pathname: '/api/runs/create' },
      JSON.stringify({ taskId: task.id, confirm: true }),
      { projectRoot: PROJECT_ROOT, allowMutations: false }
    )
    expect(created.status).toBe(200)
    const run = JSON.parse(created.body)
    expect(run.id).toMatch(/^RUN-/)

    const listed = handleGuiRequest(
      { method: 'GET', pathname: '/api/runs' },
      '',
      { projectRoot: PROJECT_ROOT, allowMutations: false }
    )
    expect(listed.status).toBe(200)
    const runs = JSON.parse(listed.body)
    expect(runs.some((entry: { id: string }) => entry.id === run.id)).toBe(true)
  })
})
