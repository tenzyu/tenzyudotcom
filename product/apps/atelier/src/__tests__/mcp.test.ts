import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const PROJECT_ROOT = mkdtempSync(path.join(tmpdir(), 'atelier-mcp-'))
const SCRIPT = path.resolve(import.meta.dir, '../cli.ts')

function writeMarkdown(relativePath: string, lines: string[]) {
  const target = path.join(PROJECT_ROOT, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

function seedProject() {
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
    '  - phase.implementation',
    '  - phase.verification',
    '  - phase.handoff',
    'required_phases:',
    '  - phase.intake',
    '  - phase.implementation',
    '  - phase.verification',
    '  - phase.handoff',
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
    'pinned:',
    '  - policy.repository',
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

async function bootClient(extraArgs: string[] = []) {
  const transport = new StdioClientTransport({
    command: 'bun',
    args: [SCRIPT, 'mcp', '--project-root', PROJECT_ROOT, ...extraArgs],
  })
  const client = new Client({ name: 'test-client', version: '0.0.0' }, { capabilities: {} })
  await client.connect(transport)
  return { client, transport }
}

describe('MCP server', () => {
  beforeEach(() => {
    seedProject()
  })

  afterAll(() => {
    rmSync(PROJECT_ROOT, { recursive: true, force: true })
  })

  test('lists tools including registry helpers', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.listTools()
      const names = result.tools.map((tool) => tool.name).sort()
      expect(names).toContain('atelier_doctor')
      expect(names).toContain('atelier_index')
      expect(names).toContain('atelier_context_plan')
      expect(names).toContain('atelier_workflow_list')
      expect(names).toContain('atelier_role_list')
      expect(names).toContain('atelier_run_init')
      expect(names).toContain('atelier_run_status')
      expect(names).toContain('atelier_run_close')
      expect(names).toContain('atelier_knowledge_propose')
      expect(names).toContain('atelier_knowledge_promote')
      expect(names).toContain('atelier_knowledge_reject')
      expect(names).toContain('atelier_id_rename')
      expect(names).toContain('atelier_repo_owner')
      expect(names).toContain('atelier_generate')
    } finally {
      await transport.close()
    }
  }, 10000)

  test('atelier_doctor returns a doctor report', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({ name: 'atelier_doctor', arguments: {} })
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.summary).toBeDefined()
      expect(Array.isArray(payload.diagnostics)).toBe(true)
    } finally {
      await transport.close()
    }
  })

  test('atelier_context_plan matches CLI plan', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_context_plan',
        arguments: {
          workflowId: 'workflow.isolated-run',
          roleIds: ['role.domain.harness-engineer'],
          inputPath: 'product/apps/atelier',
          intent: 'inspect harness',
          mode: 'compact',
        },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.workflowId).toBe('workflow.isolated-run')
      expect(payload.roleIds).toEqual(['role.domain.harness-engineer'])
      expect(payload.required.length).toBeGreaterThan(0)
      expect(payload.semantic).toBeDefined()
      expect(payload.semantic.enabled).toBe(false)
    } finally {
      await transport.close()
    }
  })

  test('atelier_workflow_list returns workflow ids without markdown discovery', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_workflow_list',
        arguments: {},
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.workflows.some((entry: { id: string }) => entry.id === 'workflow.isolated-run')).toBe(true)
    } finally {
      await transport.close()
    }
  })

  test('atelier_context_plan returns semantic hits when semantic=true', async () => {
    writeMarkdown('harness/knowledge/decisions/inspect-harness.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: decision',
      'id: knowledge.decision.inspect-harness',
      'title: Inspect Harness Decision',
      'status: active',
      'tags: [harness]',
      'summary: Inspect-harness routing decision for the harness engineer role.',
      '---',
      '# Inspect Harness Decision',
    ])
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_context_plan',
        arguments: {
          workflowId: 'workflow.isolated-run',
          roleIds: ['role.domain.harness-engineer'],
          inputPath: 'product/apps/atelier',
          intent: 'inspect harness',
          semantic: true,
        },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.semantic.enabled).toBe(true)
      const ids = (payload.semantic.hits ?? []).map((hit: { id: string }) => hit.id)
      expect(ids).toContain('knowledge.decision.inspect-harness')
    } finally {
      await transport.close()
    }
  })

  test('atelier_run_init refuses mutation without confirm in read-only mode', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_run_init',
        arguments: {
          workflowId: 'workflow.isolated-run',
          roleIds: ['role.domain.harness-engineer'],
          inputPath: 'product/apps/atelier',
          intent: 'inspect harness refused',
        },
      })
      expect(result.isError).toBe(true)
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? ''
      expect(text).toMatch(/Mutation refused/)
    } finally {
      await transport.close()
    }
  })

  test('atelier_run_init succeeds with confirm=true', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_run_init',
        arguments: {
          workflowId: 'workflow.isolated-run',
          roleIds: ['role.domain.harness-engineer'],
          inputPath: 'product/apps/atelier',
          intent: 'inspect harness confirm',
          confirm: true,
        },
      })
      expect(result.isError).toBeFalsy()
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.runId).toMatch(/^RUN-/)
      expect(payload.policy.editAllowed).toBe(true)
      expect(payload.nextActions[0].kind).toBe('read_file')
    } finally {
      await transport.close()
    }
  })

  test('atelier_run_init succeeds without confirm when started with --allow-mutations', async () => {
    const { client, transport } = await bootClient(['--allow-mutations'])
    try {
      const result = await client.callTool({
        name: 'atelier_run_init',
        arguments: {
          workflowId: 'workflow.isolated-run',
          roleIds: ['role.domain.harness-engineer'],
          inputPath: 'product/apps/atelier',
          intent: 'inspect harness allow-mutations',
        },
      })
      expect(result.isError).toBeFalsy()
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.runId).toMatch(/^RUN-/)
    } finally {
      await transport.close()
    }
  })

  test('atelier_id_rename previews by default', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_id_rename',
        arguments: {
          oldId: 'role.domain.harness-engineer',
          newId: 'role.domain.harness-engineer-renamed',
        },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.written).toBe(false)
    } finally {
      await transport.close()
    }
  })

  test('atelier_repo_owner returns project and owner role', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.callTool({
        name: 'atelier_repo_owner',
        arguments: { path: 'product/apps/atelier/src' },
      })
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.path).toBe('product/apps/atelier/src')
      expect(payload.ownerRole).toBe('role.domain.harness-engineer')
    } finally {
      await transport.close()
    }
  })

  test('atelier_index writes repo-map.json and path-ownership.json', async () => {
    const { client, transport } = await bootClient(['--allow-mutations'])
    try {
      const result = await client.callTool({
        name: 'atelier_index',
        arguments: { write: true, confirm: true },
      })
      expect(result.isError).toBeFalsy()
      const text = (result.content as Array<{ type: string; text: string }>)[0]?.text ?? '{}'
      const payload = JSON.parse(text)
      expect(payload.staleFiles).toBeDefined()
      const writtenFiles = (payload.staleFiles as string[]).concat(
        Object.keys(payload.files ?? {}),
      )
      expect(writtenFiles).toContain('repo-map.json')
      expect(writtenFiles).toContain('path-ownership.json')
    } finally {
      await transport.close()
    }
  })
})
