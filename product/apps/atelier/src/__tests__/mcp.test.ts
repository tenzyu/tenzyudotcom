import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { MCP_TOOL_NAMES } from '../core/mcp'

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

  test('lists tools', async () => {
    const { client, transport } = await bootClient()
    try {
      const result = await client.listTools()
      const names = result.tools.map((tool) => tool.name).sort()
      expect(names).toEqual([...MCP_TOOL_NAMES].sort())
      expect(names).toContain('atelier_doctor')
      expect(names).toContain('atelier_scan')
      expect(names).toContain('atelier_context_plan')
      expect(names).toContain('atelier_reconcile')
      expect(names).toContain('atelier_repair')
      expect(names).toContain('atelier_policy_check')
      expect(names).toContain('atelier_task_close')
      expect(names).toContain('atelier_run_create')
      expect(names).toContain('atelier_run_list')
      expect(names).toContain('atelier_run_complete')

      expect(names).toContain('atelier_reconcile')
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
      expect(payload.selectorV2.traces.length).toBeGreaterThan(0)
    } finally {
      await transport.close()
    }
  })

})
