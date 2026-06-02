import { afterAll, afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { startGuiServer } from '../core/gui-server'
import { handleGuiRequest } from '../core/gui'

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
    rmSync(path.join(PROJECT_ROOT, 'harness/runs/active'), { recursive: true, force: true })
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

  test('GET /api/runs lists active runs', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: true, host: '127.0.0.1', port: 0 })
    const init = await fetchFromServer(server, '/api/runs/init', {
      method: 'POST',
      body: {
        workflowId: 'workflow.isolated-run',
        roleIds: ['role.domain.harness-engineer'],
        inputPath: 'product/apps/atelier',
        intent: 'inspect',
        confirm: true,
      },
    })
    expect(init.status).toBe(200)
    const runs = await fetchFromServer(server, '/api/runs')
    expect(runs.status).toBe(200)
    const names = runs.json?.runs ?? []
    expect(names.length).toBeGreaterThan(0)
  })

  test('GET /api/runs/:id/status reports missing run', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/runs/RUN-missing/status')
    expect(response.status).toBe(200)
    expect(response.json?.diagnostics?.[0]?.code).toBe('MISSING_RUN_ARTIFACT')
  })

  test('POST /api/context/plan returns a plan', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/context/plan', {
      method: 'POST',
      body: {
        workflowId: 'workflow.isolated-run',
        roleIds: ['role.domain.harness-engineer'],
        inputPath: 'product/apps/atelier',
        intent: 'inspect',
      },
    })
    expect(response.status).toBe(200)
    expect(response.json?.required.length).toBeGreaterThan(0)
  })

  test('POST /api/context/plan validates missing fields', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/context/plan', {
      method: 'POST',
      body: { workflowId: 'workflow.isolated-run' },
    })
    expect(response.status).toBe(400)
  })

  test('POST /api/runs/init refuses without confirm', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/runs/init', {
      method: 'POST',
      body: {
        workflowId: 'workflow.isolated-run',
        roleIds: ['role.domain.harness-engineer'],
        inputPath: 'product/apps/atelier',
        intent: 'inspect',
      },
    })
    expect(response.status).toBe(400)
    expect(response.json?.error?.message).toMatch(/Mutation refused/)
  })

  test('GET /api/repo-owner resolves a path', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/repo-owner?path=product/apps/atelier/src')
    expect(response.status).toBe(200)
    expect(response.json?.ownerRole).toBe('role.domain.harness-engineer')
  })

  test('GET /api/repo-map returns the generated repo map', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/repo-map')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.json?.projects)).toBe(true)
    expect(Array.isArray(response.json?.ownershipHints)).toBe(true)
  })

  test('GET /api/path-ownership returns the generated ownership index', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/path-ownership')
    expect(response.status).toBe(200)
    expect(Array.isArray(response.json?.entries)).toBe(true)
  })

  test('GET /api/knowledge lists proposals', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: true, host: '127.0.0.1', port: 0 })
    const init = await fetchFromServer(server, '/api/runs/init', {
      method: 'POST',
      body: {
        workflowId: 'workflow.isolated-run',
        roleIds: ['role.domain.harness-engineer'],
        inputPath: 'product/apps/atelier',
        intent: 'inspect',
        confirm: true,
      },
    })
    const runId = init.json?.runId
    expect(runId).toBeDefined()
    const propose = await fetchFromServer(server, '/api/knowledge/propose', {
      method: 'POST',
      body: {
        fromRun: runId,
        kind: 'rule',
        title: 'Test rule',
        confirm: true,
      },
    })
    expect(propose.status).toBe(200)
    const list = await fetchFromServer(server, '/api/knowledge')
    expect(list.json?.proposals?.length).toBeGreaterThan(0)
  })

  test('POST /api/id/rename previews by default', async () => {
    server = startGuiServer({ projectRoot: PROJECT_ROOT, allowMutations: false, host: '127.0.0.1', port: 0 })
    const response = await fetchFromServer(server, '/api/id/rename', {
      method: 'POST',
      body: {
        oldId: 'role.domain.harness-engineer',
        newId: 'role.domain.harness-engineer-renamed',
      },
    })
    expect(response.status).toBe(200)
    expect(response.json?.written).toBe(false)
  })

  test('handleGuiRequest handles unknown routes', () => {
    const response = handleGuiRequest(
      { method: 'GET', pathname: '/api/missing' },
      '',
      { projectRoot: PROJECT_ROOT, allowMutations: false }
    )
    expect(response.status).toBe(404)
  })
})
