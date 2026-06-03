import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { appendEvent, createEvent } from './events'

export type PermissionMode = 'allow' | 'deny' | 'ask' | 'advisory' | 'task' | 'block'

export type PathRule = {
  id: string
  description: string
  pattern: string
  mode: PermissionMode
}

export type CommandRule = {
  id: string
  description: string
  pattern: string
  mode: PermissionMode
}

export type ToolRule = {
  id: string
  description: string
  tool: string
  mode: PermissionMode
}

export type ApprovalPolicy = {
  id: string
  description: string
  requires: string[]
}

export type PolicyDecision = {
  ruleId: string
  ruleKind: 'path' | 'command' | 'tool' | 'approval'
  mode: PermissionMode
  reason: string
  matched: boolean
}

export type PolicyResult = {
  allowed: boolean
  effectiveMode: PermissionMode
  decisions: PolicyDecision[]
}

export type PolicyConfig = {
  pathRules: PathRule[]
  commandRules: CommandRule[]
  toolRules: ToolRule[]
  approvalPolicies: ApprovalPolicy[]
}

export type PolicyCheckOptions = {
  projectRoot?: string
  path?: string
  command?: string
  tool?: string
}

export type PolicySimulateChanges = {
  pathRules?: PathRule[]
  commandRules?: CommandRule[]
  toolRules?: ToolRule[]
}

const DEFAULT_PATH_RULES: PathRule[] = [
  { id: 'policy.path.allow-harness-read', description: 'Read harness files', pattern: 'harness/**', mode: 'allow' },
  { id: 'policy.path.deny-dot-harness-write', description: 'Block generated harness writes', pattern: '.harness/generated/**', mode: 'deny' },
  { id: 'policy.path.advisory-node-modules', description: 'Advise before writing node_modules', pattern: 'node_modules/**', mode: 'advisory' },
  { id: 'policy.path.deny-system-dirs', description: 'Block dangerous system paths', pattern: '/{etc,dev,proc,sys,bin,sbin,usr/lib,system}/**', mode: 'block' },
  { id: 'policy.path.ask-secrets', description: 'Ask before touching secrets', pattern: '**/.env*', mode: 'ask' },
  { id: 'policy.path.allow-src', description: 'Allow source files', pattern: 'product/**/src/**', mode: 'allow' },
  { id: 'policy.path.deny-git-dirs', description: 'Block direct .git writes', pattern: '.git/**', mode: 'block' },
]

const DEFAULT_COMMAND_RULES: CommandRule[] = [
  { id: 'policy.cmd.allow-npm', description: 'Allow npm commands', pattern: '^(npm|bun|pnpm|yarn)\\s', mode: 'allow' },
  { id: 'policy.cmd.advisory-rm', description: 'Advise before destructive fs commands', pattern: '^rm\\s+(-rf?\\s+)?/', mode: 'advisory' },
  { id: 'policy.cmd.deny-curl-exec', description: 'Block unsafe curl pipe', pattern: 'curl.*\\|\\s*(bash|sh|zsh)', mode: 'block' },
  { id: 'policy.cmd.deny-chmod-recursive', description: 'Block recursive chmod on root', pattern: 'chmod\\s+-R\\s+.*\\s+/', mode: 'block' },
  { id: 'policy.cmd.allow-git', description: 'Allow git commands', pattern: '^git\\s', mode: 'allow' },
  { id: 'policy.cmd.allow-test', description: 'Allow test commands', pattern: 'bun\\s+(test|run.*test)', mode: 'allow' },
]

const DEFAULT_TOOL_RULES: ToolRule[] = [
  { id: 'policy.tool.allow-read', description: 'Allow read-only tools', tool: 'read', mode: 'allow' },
  { id: 'policy.tool.allow-search', description: 'Allow search tools', tool: 'grep|glob|search', mode: 'allow' },
  { id: 'policy.tool.allow-web', description: 'Allow web fetch and search', tool: 'webfetch|websearch', mode: 'allow' },
  { id: 'policy.tool.allow-bash', description: 'Allow bash execution', tool: 'bash', mode: 'allow' },
  { id: 'policy.tool.ask-edit', description: 'Ask before file edits', tool: 'edit|write', mode: 'ask' },
]

const DEFAULT_APPROVAL_POLICIES: ApprovalPolicy[] = [
  { id: 'policy.approval.destructive', description: 'Destructive file operations require approval', requires: ['human-confirmation', 'backup-check'] },
  { id: 'policy.approval.env-changes', description: 'Environment changes require approval', requires: ['human-confirmation', 'env-diff'] },
]

const POLICY_DIR = 'harness/policies'

function policyConfigPath(projectRoot: string): string {
  return path.join(projectRoot, POLICY_DIR, 'config.json')
}

export function loadPolicyConfig(projectRoot: string): PolicyConfig {
  const configPath = policyConfigPath(projectRoot)
  if (existsSync(configPath)) {
    try {
      const raw = readFileSync(configPath, 'utf-8')
      return JSON.parse(raw) as PolicyConfig
    } catch {
      // fall through to defaults
    }
  }
  return {
    pathRules: DEFAULT_PATH_RULES,
    commandRules: DEFAULT_COMMAND_RULES,
    toolRules: DEFAULT_TOOL_RULES,
    approvalPolicies: DEFAULT_APPROVAL_POLICIES,
  }
}

export function savePolicyConfig(projectRoot: string, config: PolicyConfig): void {
  const configPath = policyConfigPath(projectRoot)
  mkdirSync(path.dirname(configPath), { recursive: true })
  writeFileSync(configPath, JSON.stringify(config, null, 2))
}

function matchesGlob(pattern: string, value: string): boolean {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '___GLOBSTAR___')
    .replace(/\*/g, '[^/]*')
    .replace(/___GLOBSTAR___/g, '.*')
  const regex = new RegExp(`^${escaped}$`)
  return regex.test(value)
}

export function evaluatePath(pathValue: string, rules: PathRule[]): PolicyResult {
  const decisions: PolicyDecision[] = []
  for (const rule of rules) {
    const matched = matchesGlob(rule.pattern, pathValue)
    decisions.push({
      ruleId: rule.id,
      ruleKind: 'path',
      mode: rule.mode,
      reason: matched ? `Path "${pathValue}" matched rule "${rule.id}": ${rule.description}` : 'No match',
      matched,
    })
  }
  return computeResult(decisions)
}

export function evaluateCommand(command: string, rules: CommandRule[]): PolicyResult {
  const decisions: PolicyDecision[] = []
  for (const rule of rules) {
    const regex = new RegExp(rule.pattern)
    const matched = regex.test(command)
    decisions.push({
      ruleId: rule.id,
      ruleKind: 'command',
      mode: rule.mode,
      reason: matched ? `Command "${command}" matched rule "${rule.id}": ${rule.description}` : 'No match',
      matched,
    })
  }
  return computeResult(decisions)
}

export function evaluateTool(tool: string, rules: ToolRule[]): PolicyResult {
  const decisions: PolicyDecision[] = []
  for (const rule of rules) {
    const toolPatterns = rule.tool.split('|')
    const matched = toolPatterns.some((p) => {
      if (p.includes('*')) {
        const regex = new RegExp(`^${p.replace(/\*/g, '.*')}$`)
        return regex.test(tool)
      }
      return p === tool
    })
    decisions.push({
      ruleId: rule.id,
      ruleKind: 'tool',
      mode: rule.mode,
      reason: matched ? `Tool "${tool}" matched rule "${rule.id}": ${rule.description}` : 'No match',
      matched,
    })
  }
  return computeResult(decisions)
}

export function evaluateApproval(pathValue: string, command: string, tool: string, policies: ApprovalPolicy[]): PolicyResult {
  const decisions: PolicyDecision[] = []
  for (const policy of policies) {
    const matched = pathValue !== '' || command !== '' || tool !== ''
    decisions.push({
      ruleId: policy.id,
      ruleKind: 'approval',
      mode: matched ? 'ask' : 'allow',
      reason: matched
        ? `Approval policy "${policy.id}" triggered: requires ${policy.requires.join(', ')}`
        : 'No approval needed',
      matched,
    })
  }
  return computeResult(decisions)
}

function computeResult(decisions: PolicyDecision[]): PolicyResult {
  const matched = decisions.filter((d) => d.matched)

  const denyRule = matched.find((d) => d.mode === 'deny')
  if (denyRule) return { allowed: false, effectiveMode: 'deny', decisions }

  const blockRule = matched.find((d) => d.mode === 'block')
  if (blockRule) return { allowed: false, effectiveMode: 'block', decisions }

  const askRule = matched.find((d) => d.mode === 'ask')
  if (askRule) return { allowed: false, effectiveMode: 'ask', decisions }

  const taskRule = matched.find((d) => d.mode === 'task')
  if (taskRule) return { allowed: true, effectiveMode: 'task', decisions }

  const advisoryRule = matched.find((d) => d.mode === 'advisory')
  if (advisoryRule) return { allowed: true, effectiveMode: 'advisory', decisions }

  return { allowed: true, effectiveMode: 'allow', decisions }
}

export function checkPolicy(options: PolicyCheckOptions): PolicyResult[] {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const config = loadPolicyConfig(projectRoot)
  const results: PolicyResult[] = []

  if (options.path) {
    results.push(evaluatePath(options.path, config.pathRules))
    results.push(evaluateApproval(options.path, '', '', config.approvalPolicies))
  }

  if (options.command) {
    results.push(evaluateCommand(options.command, config.commandRules))
  }

  if (options.tool) {
    results.push(evaluateTool(options.tool, config.toolRules))
  }

  if (results.length === 0) {
    results.push({
      allowed: true,
      effectiveMode: 'allow',
      decisions: [{
        ruleId: 'policy.default',
        ruleKind: 'path',
        mode: 'allow',
        reason: 'No policy checks requested — default allow',
        matched: false,
      }],
    })
  }

  for (const result of results) {
    if (!result.allowed || result.effectiveMode === 'advisory' || result.effectiveMode === 'task') {
      appendEvent(
        projectRoot,
        createEvent('policy_decision', {
          allowed: result.allowed,
          effectiveMode: result.effectiveMode,
          decisions: result.decisions.filter((d) => d.matched).map((d) => ({ ruleId: d.ruleId, ruleKind: d.ruleKind, mode: d.mode })),
        }, 'policy.ts'),
      )
    }
  }

  return results
}

export function explainPolicy(projectRoot: string, ruleId?: string): { config: PolicyConfig; decisions: PolicyDecision[] } {
  const root = path.resolve(projectRoot)
  const config = loadPolicyConfig(root)
  const decisions: PolicyDecision[] = []

  if (ruleId) {
    for (const rule of config.pathRules) {
      if (rule.id === ruleId) {
        decisions.push({ ruleId: rule.id, ruleKind: 'path', mode: rule.mode, reason: rule.description, matched: true })
      }
    }
    for (const rule of config.commandRules) {
      if (rule.id === ruleId) {
        decisions.push({ ruleId: rule.id, ruleKind: 'command', mode: rule.mode, reason: rule.description, matched: true })
      }
    }
    for (const rule of config.toolRules) {
      if (rule.id === ruleId) {
        decisions.push({ ruleId: rule.id, ruleKind: 'tool', mode: rule.mode, reason: rule.description, matched: true })
      }
    }
    for (const policy of config.approvalPolicies) {
      if (policy.id === ruleId) {
        decisions.push({ ruleId: policy.id, ruleKind: 'approval', mode: 'ask', reason: policy.description, matched: true })
      }
    }
    if (decisions.length === 0) {
      decisions.push({ ruleId: ruleId, ruleKind: 'path', mode: 'allow', reason: `Rule "${ruleId}" not found`, matched: false })
    }
  } else {
    for (const rule of config.pathRules) {
      decisions.push({ ruleId: rule.id, ruleKind: 'path', mode: rule.mode, reason: rule.description, matched: true })
    }
    for (const rule of config.commandRules) {
      decisions.push({ ruleId: rule.id, ruleKind: 'command', mode: rule.mode, reason: rule.description, matched: true })
    }
    for (const rule of config.toolRules) {
      decisions.push({ ruleId: rule.id, ruleKind: 'tool', mode: rule.mode, reason: rule.description, matched: true })
    }
    for (const policy of config.approvalPolicies) {
      decisions.push({ ruleId: policy.id, ruleKind: 'approval', mode: 'ask', reason: policy.description, matched: true })
    }
  }

  return { config, decisions }
}

export function simulatePolicy(projectRoot: string, changes: PolicySimulateChanges): PolicyResult[] {
  const root = path.resolve(projectRoot)
  const config = loadPolicyConfig(root)

  if (changes.pathRules) config.pathRules = changes.pathRules
  if (changes.commandRules) config.commandRules = changes.commandRules
  if (changes.toolRules) config.toolRules = changes.toolRules

  const results: PolicyResult[] = []

  if (changes.pathRules) {
    for (const rule of changes.pathRules) {
      results.push(evaluatePath(rule.pattern, changes.pathRules))
    }
  }

  if (changes.commandRules) {
    for (const rule of changes.commandRules) {
      results.push(evaluateCommand(rule.pattern, changes.commandRules))
    }
  }

  if (changes.toolRules) {
    for (const rule of changes.toolRules) {
      results.push(evaluateTool(rule.tool, changes.toolRules))
    }
  }

  return results
}
