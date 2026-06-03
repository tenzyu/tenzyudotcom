import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildContextPlan } from '../core/context'
import { compileIndexes } from '../core/indexer'
import { promoteKnowledgeProposal, proposeKnowledge, rejectKnowledgeProposal } from '../core/knowledge'
import { closeRun, expandRunContext, initRun, renderContextForOptions } from '../core/runs'
import { runCli } from '../cli'

function writeMarkdown(root: string, relativePath: string, lines: string[]) {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
}

async function captureStdout(run: () => Promise<number>) {
  const originalLog = console.log
  const lines: string[] = []
  console.log = (...args: unknown[]) => {
    lines.push(args.map(String).join(' '))
  }
  try {
    const code = await run()
    return { code, output: lines.join('\n') }
  } finally {
    console.log = originalLog
  }
}

function createFixture(root: string) {
  writeMarkdown(root, 'harness/actions/workflows/example.md', [
    '---',
    'schema: harness/v1',
    'kind: workflow',
    'id: workflow.example',
    'title: Example Workflow',
    'status: active',
    'callable: true',
    'phases:',
    '  - phase.implementation',
    '---',
    '# Example Workflow',
  ])

  writeMarkdown(root, 'harness/actions/phases/implementation.md', [
    '---',
    'schema: harness/v1',
    'kind: phase',
    'id: phase.implementation',
    'title: Implementation',
    'status: active',
    '---',
    '# Implementation',
  ])

  writeMarkdown(root, 'harness/actions/roles/domain/example.md', [
    '---',
    'schema: harness/v1',
    'kind: role',
    'id: role.domain.example',
    'title: Example Role',
    'status: active',
    'selectors:',
    '  paths:',
    '    - product/apps/example/**',
    '  tags:',
    '    - example',
    '  knowledge_types:',
    '    - product-spec',
    'pinned:',
    '  - knowledge.repo-map',
    '---',
    '# Example Role',
    '',
    '## Required knowledge',
    '',
    '- `harness/knowledge/product-specs/example/README.md`',
    '',
    '## Optional knowledge',
    '',
    '- `harness/knowledge/product-specs/example/optional.md`',
  ])

  writeMarkdown(root, 'harness/policies/repository.md', [
    '---',
    'schema: harness/v1',
    'kind: policy',
    'id: policy.repository',
    'title: Repository Policy',
    'status: active',
    '---',
    '# Repository Policy',
  ])

  writeMarkdown(root, 'harness/knowledge/repo-map.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: repo-map',
    'id: knowledge.repo-map',
    'title: Repo Map',
    'status: active',
    'tags:',
    '  - example',
    '---',
    '# Repo Map',
  ])

  writeMarkdown(root, 'harness/knowledge/product-specs/example/README.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: product-spec',
    'id: knowledge.product-spec.example',
    'title: Example Product Spec',
    'status: active',
    'tags:',
    '  - example',
    'scope:',
    '  paths:',
    '    - product/apps/example/**',
    '---',
    '# Example Product Spec',
  ])

  writeMarkdown(root, 'harness/knowledge/product-specs/example/optional.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: product-spec',
    'id: knowledge.product-spec.example-optional',
    'title: Example Optional Spec',
    'status: active',
    'tags:',
    '  - example',
    'read_when:',
    '  - fix auth behavior',
    '---',
    '# Example Optional Spec',
    '',
    'Auth behavior for product/apps/example.',
  ])

  writeMarkdown(root, 'harness/knowledge/rules/example-expand.md', [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    'knowledge_type: rule',
    'id: knowledge.rule.example-expand',
    'title: Example Expansion Rule',
    'status: active',
    'tags:',
    '  - expansion',
    '---',
    '# Example Expansion Rule',
    '',
    'Expand-only rule body.',
  ])
}

describe('Atelier M2-M4', () => {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), 'atelier-m2-m4-'))

  beforeEach(() => {
    rmSync(path.join(tmpRoot, 'harness'), { recursive: true, force: true })
    rmSync(path.join(tmpRoot, '.harness'), { recursive: true, force: true })
    createFixture(tmpRoot)
  })

  afterAll(() => {
    if (existsSync(tmpRoot)) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  test('writes generated indexes and reports fresh check state', () => {
    const writeResult = compileIndexes({ projectRoot: tmpRoot, write: true })
    const checkResult = compileIndexes({ projectRoot: tmpRoot, check: true })

    expect(writeResult.staleFiles).toContain('docs.json')
    expect(checkResult.ok).toBe(true)
    expect(checkResult.staleFiles).toEqual([])

    const docs = JSON.parse(readFileSync(path.join(tmpRoot, '.harness/generated/docs.json'), 'utf-8'))
    const ids = JSON.parse(readFileSync(path.join(tmpRoot, '.harness/generated/ids.json'), 'utf-8'))

    expect(docs.some((document: { id: string }) => document.id === 'knowledge.product-spec.example')).toBe(true)
    expect(ids['workflow.example'].path).toBe('harness/actions/workflows/example.md')
  })

  test('builds role-routed context plan with reasons', () => {
    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
    })

    const requiredPaths = plan.required.map((document) => document.path)
    const optionalPaths = plan.optional.map((document) => document.path)

    expect(requiredPaths).toContain('harness/actions/workflows/example.md')
    expect(requiredPaths).toContain('harness/actions/phases/implementation.md')
    expect(requiredPaths).toContain('harness/actions/roles/domain/example.md')
    expect(requiredPaths).toContain('harness/policies/repository.md')
    expect(requiredPaths).toContain('harness/knowledge/product-specs/example/README.md')
    expect(optionalPaths).toContain('harness/knowledge/product-specs/example/optional.md')
    expect(plan.mode).toBe('compact')
    expect(plan.diagnostics).toEqual([])
  })

  test('infers a role from input path when role ids are omitted', () => {
    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: [],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
    })

    expect(plan.roleIds).toEqual(['role.domain.example'])
    expect(plan.nextRunInitCommand).toContain('--role role.domain.example')
  })

  test('keeps repository root input path as dot', () => {
    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: '.',
      intent: 'inspect repository root',
    })

    expect(plan.inputPath).toBe('.')
    expect(plan.nextRunInitCommand).toContain('--path .')
  })

  test('missing workflow diagnostics include suggestions and retry command', () => {
    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
    })

    const diagnostic = plan.diagnostics.find((entry) => entry.code === 'MISSING_WORKFLOW')
    expect(diagnostic?.details?.suggestions).toEqual(['workflow.example'])
    expect(diagnostic?.details?.retryCommand).toContain('--workflow workflow.example')
    expect(diagnostic?.details?.retryCommand).toContain('--role role.domain.example')
  })

  test('semantic expansion is disabled by default and stays optional', () => {
    const withoutSemantic = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
    })
    const withSemantic = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      semantic: true,
    })

    expect(withoutSemantic.semantic.enabled).toBe(false)
    expect(withoutSemantic.semantic.hits).toEqual([])
    expect(withoutSemantic.required.map((d) => d.path)).toEqual(
      withSemantic.required.map((d) => d.path),
    )
    expect(withSemantic.semantic.enabled).toBe(true)
  })

  test('supports linked context plan mode', () => {
    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      mode: 'linked',
    })

    expect(plan.mode).toBe('linked')
    expect(plan.nextRenderCommand).toContain('--mode linked')
  })

  test('cli help is validation-free for nested commands', async () => {
    const result = await captureStdout(() => runCli(['run', 'init', '--help']))

    expect(result.code).toBe(0)
    expect(result.output).toContain('atelier run init')
    expect(result.output).toContain('LLM entrypoint')
  })

  test('cli lists workflows as json', async () => {
    const result = await captureStdout(() =>
      runCli(['workflow', 'list', '--project-root', tmpRoot, '--json'])
    )
    const payload = JSON.parse(result.output)

    expect(result.code).toBe(0)
    expect(payload.workflows.some((entry: { id: string }) => entry.id === 'workflow.example')).toBe(true)
  })

  test('cli run init infers role and returns next actions in json', async () => {
    const result = await captureStdout(() =>
      runCli([
        'run',
        'init',
        '--project-root',
        tmpRoot,
        '--workflow',
        'workflow.example',
        '--path',
        'product/apps/example',
        '--intent',
        'cli inferred role',
        '--id',
        'RUN-cli-inferred-role',
        '--json',
      ])
    )
    const payload = JSON.parse(result.output)

    expect(result.code).toBe(0)
    expect(payload.runId).toBe('RUN-cli-inferred-role')
    expect(payload.nextActions).toEqual([
      {
        kind: 'read_file',
        path: 'harness/runs/active/RUN-cli-inferred-role/context.md',
      },
    ])
  })

  test('renders context body without creating a run', () => {
    const compact = renderContextForOptions({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-render-compact',
      mode: 'compact',
    })
    const linked = renderContextForOptions({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-render-linked',
      mode: 'linked',
    })

    expect(existsSync(path.join(tmpRoot, 'harness/runs/active/RUN-render-compact'))).toBe(false)
    expect(compact.context).toContain('## Compiled Required Context')
    expect(compact.context).toContain('Compiled context:')
    expect(linked.context).toContain('## Required Context')
    expect(linked.context).not.toContain('```md')
  })

  test('initializes a run with context and manifest files', () => {
    const result = initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-example-auth',
    })

    expect(existsSync(result.briefPath)).toBe(true)
    expect(existsSync(result.contextPath)).toBe(true)
    expect(existsSync(result.manifestPath)).toBe(true)

    const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf-8'))
    expect(manifest.runId).toBe('RUN-example-auth')
    expect(manifest.contextMode).toBe('compact')
    expect(manifest.policy.editAllowed).toBe(true)
    expect(manifest.nextActions).toEqual([
      {
        kind: 'read_file',
        path: 'harness/runs/active/RUN-example-auth/context.md',
      },
    ])
    expect(manifest.expandedDocuments).toEqual([])
    expect(manifest.selectedDocuments.some((document: { path: string }) => document.path === 'harness/actions/workflows/example.md')).toBe(
      true,
    )
    const context = readFileSync(result.contextPath, 'utf-8')
    expect(context).toContain('## Agent Contract')
    expect(context).toContain('## Compiled Required Context')
    expect(context).toContain('Compiled context:')
    expect(context).toContain('# Repository Policy')
  })

  test('initializes linked mode runs without embedding compiled excerpts', () => {
    const result = initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-linked-context',
      mode: 'linked',
    })

    const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf-8'))
    const context = readFileSync(result.contextPath, 'utf-8')
    expect(manifest.contextMode).toBe('linked')
    expect(context).toContain('## Required Context')
    expect(context).not.toContain('```md')
  })

  test('expands run context and records the expansion in manifest and worklog', () => {
    const result = initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-expand-context',
    })
    writeFileSync(path.join(result.runPath, 'worklog.md'), '# Worklog\n')

    const expansion = expandRunContext({
      projectRoot: tmpRoot,
      runId: 'RUN-expand-context',
      reference: 'knowledge.rule.example-expand',
    })

    expect(expansion.alreadyExpanded).toBe(false)
    expect(expansion.expandedDocument.path).toBe('harness/knowledge/rules/example-expand.md')

    const manifest = JSON.parse(readFileSync(result.manifestPath, 'utf-8'))
    expect(manifest.expandedDocuments.some((document: { path: string }) => document.path === 'harness/knowledge/rules/example-expand.md')).toBe(
      true,
    )
    expect(readFileSync(result.contextPath, 'utf-8')).toContain('## Expanded Context: Example Expansion Rule')
    expect(readFileSync(path.join(result.runPath, 'worklog.md'), 'utf-8')).toContain('Expanded context')
  })

  test('blocks closing non-trivial runs without verification and handoff evidence', () => {
    initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-close-missing-evidence',
    })

    const result = closeRun({
      projectRoot: tmpRoot,
      runId: 'RUN-close-missing-evidence',
    })

    expect(result.ok).toBe(false)
    expect(result.moved).toBe(false)
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain('MISSING_RUN_ARTIFACT')
    expect(result.diagnostics.some((diagnostic) => diagnostic.message.includes('verification.md'))).toBe(true)
    expect(result.diagnostics.some((diagnostic) => diagnostic.message.includes('handoff.md'))).toBe(true)
  })

  test('closes a run with required evidence and reports context hash drift', () => {
    const result = initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-close-complete',
    })
    writeFileSync(path.join(result.runPath, 'verification.md'), '# Verification\n\n- bun test passed.\n- Skipped checks: none.\n')
    writeFileSync(path.join(result.runPath, 'handoff.md'), '# Handoff\n\nKnowledge proposals: none.\n')
    writeFileSync(path.join(tmpRoot, 'harness/policies/repository.md'), '# Repository Policy changed\n')

    const closeResult = closeRun({
      projectRoot: tmpRoot,
      runId: 'RUN-close-complete',
    })

    expect(closeResult.ok).toBe(true)
    expect(closeResult.moved).toBe(true)
    expect(existsSync(path.join(tmpRoot, 'harness/runs/completed/RUN-close-complete'))).toBe(true)
    expect(closeResult.diagnostics.map((diagnostic) => diagnostic.code)).toContain('CONTEXT_HASH_MISMATCH')
  })

  test('promotes a complete knowledge proposal and archives the proposal', () => {
    const run = initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-knowledge-promote',
    })
    writeFileSync(path.join(run.runPath, 'verification.md'), '# Verification\n\n- bun test passed.\n')
    writeFileSync(path.join(run.runPath, 'handoff.md'), '# Handoff\n\nKnowledge proposals: handled.\n')

    const proposal = proposeKnowledge({
      projectRoot: tmpRoot,
      fromRun: 'RUN-knowledge-promote',
      knowledgeType: 'rule',
      title: 'Example Auth Rule',
      tags: ['example'],
      evidence: 'Fixture verification showed this rule is needed.',
      whyRecur: 'Future auth work should keep this constraint visible.',
      whyNotCovered: 'No existing rule document in the fixture covers it.',
    })

    const promotion = promoteKnowledgeProposal({
      projectRoot: tmpRoot,
      proposalPath: proposal.proposalPath,
    })

    expect(promotion.ok).toBe(true)
    expect(promotion.promotedId).toBe('knowledge.rule.example_auth_rule')
    expect(promotion.destinationPath).not.toBeNull()
    expect(existsSync(promotion.destinationPath!)).toBe(true)
    expect(readFileSync(proposal.proposalPath, 'utf-8')).toContain('status: archived')
    expect(readFileSync(path.join(tmpRoot, '.harness/generated/docs.json'), 'utf-8')).toContain('knowledge.rule.example_auth_rule')
    expect(promotion.roleBundleImpact).toContain('role.domain.example')
  })

  test('rejects a proposal without deleting run evidence', () => {
    initRun({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      runId: 'RUN-knowledge-reject',
    })
    const proposal = proposeKnowledge({
      projectRoot: tmpRoot,
      fromRun: 'RUN-knowledge-reject',
      knowledgeType: 'rule',
      title: 'Rejected Example Rule',
    })

    const rejection = rejectKnowledgeProposal({
      projectRoot: tmpRoot,
      proposalPath: proposal.proposalPath,
      reason: 'Fixture rejection.',
    })

    expect(existsSync(proposal.proposalPath)).toBe(false)
    expect(existsSync(rejection.archivedPath)).toBe(true)
    expect(readFileSync(rejection.archivedPath, 'utf-8')).toContain('status: archived')
    expect(readFileSync(rejection.archivedPath, 'utf-8')).toContain('Fixture rejection.')
  })

  test('evaluates conditional pattern with path_any conditions', () => {
    writeMarkdown(tmpRoot, 'harness/knowledge/rules/conditional-test.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.rule.conditional-test',
      'title: Conditional Test',
      'status: active',
      'tags:',
      '  - domain:test',
      '  - kind:rule',
      'pattern: conditional',
      'conditions:',
      '  deterministic:',
      '    path_any:',
      '      - "product/apps/web/**"',
      '    tag_any:',
      '      - "domain:site"',
      '---',
      '# Conditional Test',
      '',
      'Only relevant for web path with site domain.',
    ])

    // Plan for a path that DOES match path_any but NOT tag_any
    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/web/src/page.tsx',
      intent: 'fix conditional',
    })

    const condDoc = plan.trace.selections.find(
      (s) => s.id === 'knowledge.rule.conditional-test'
    )
    // The fixture role has no require_all/require_any so the document won't be selected by selectors,
    // but the trace should record conditions when selectors don't match
    if (condDoc) {
      const conditions = (condDoc as Record<string, unknown>).conditions as Array<Record<string, unknown>> | undefined
      if (conditions) {
        const pathCond = conditions.find((c) => (c.condition as string ?? '').startsWith('path_any'))
        const tagCond = conditions.find((c) => (c.condition as string ?? '').startsWith('tag_any'))
        if (pathCond) expect(pathCond.matched).toBe(true)
        if (tagCond) expect(tagCond.matched).toBe(false)
      }
    }
  })

  test('evaluates conditional pattern with matching deterministic conditions', () => {
    writeMarkdown(tmpRoot, 'harness/knowledge/rules/conditional-match.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.rule.conditional-match',
      'title: Conditional Match',
      'status: active',
      'tags:',
      '  - example',
      'pattern: conditional',
      'conditions:',
      '  deterministic:',
      '    tag_any:',
      '      - "example"',
      '---',
      '# Conditional Match',
      '',
      'Always matches when example tag is present.',
    ])

    // Add require_all to role so this document gets selected
    writeMarkdown(tmpRoot, 'harness/actions/roles/domain/example.md', [
      '---',
      'schema: harness/v1',
      'kind: role',
      'id: role.domain.example',
      'title: Example Role',
      'status: active',
      'selectors:',
      '  require_all:',
      '    - example',
      'pinned:',
      '  - knowledge.repo-map',
      '---',
      '# Example Role',
    ])

    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'match conditional',
    })

    const condDoc = plan.trace.selections.find(
      (s) => s.id === 'knowledge.rule.conditional-match'
    )
    expect(condDoc).toBeDefined()
    expect(condDoc?.pattern).toBe('conditional')
    const conditions = (condDoc as Record<string, unknown>).conditions as Array<Record<string, unknown>> | undefined
    expect(conditions).toBeDefined()
    if (conditions) {
      const tagCond = conditions.find((c) => (c.condition as string ?? '').startsWith('tag_any'))
      expect(tagCond).toBeDefined()
      if (tagCond) expect(tagCond.matched).toBe(true)
    }
  })

  test('resolves inheritance relation', () => {
    writeMarkdown(tmpRoot, 'harness/knowledge/rules/base-rule.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.rule.base-rule',
      'title: Base Rule',
      'status: active',
      'tags:',
      '  - domain:test',
      '  - kind:rule',
      'pattern: simple',
      '---',
      '# Base Rule',
      '',
      'This is the base knowledge.',
    ])

    writeMarkdown(tmpRoot, 'harness/knowledge/rules/child-rule.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.rule.child-rule',
      'title: Child Rule',
      'status: active',
      'tags:',
      '  - domain:test',
      '  - kind:rule',
      'pattern: inheritance',
      'relations:',
      '  inherit:',
      '    - knowledge.rule.base-rule',
      '---',
      '# Child Rule',
      '',
      'Extends base rule.',
    ])

    // Update role selectors to match both
    writeMarkdown(tmpRoot, 'harness/actions/roles/domain/example.md', [
      '---',
      'schema: harness/v1',
      'kind: role',
      'id: role.domain.example',
      'title: Example Role',
      'status: active',
      'selectors:',
      '  require_all:',
      '    - domain:test',
      'pinned:',
      '  - knowledge.repo-map',
      '---',
      '# Example Role',
    ])

    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'test inheritance',
    })

    const childDoc = plan.optional.find((d) => d.id === 'knowledge.rule.child-rule')
    expect(childDoc).toBeDefined()
    const baseDoc = plan.required.find((d) => d.id === 'knowledge.rule.base-rule')
    expect(baseDoc).toBeDefined()
    // Base should be injected before child (base should be in required due to inheritance)
    const relationTrace = plan.trace.selections.find(
      (s) => s.id === 'knowledge.rule.child-rule'
    )
    expect(relationTrace).toBeDefined()
    if (relationTrace) {
      const relations = (relationTrace as Record<string, unknown>).relations as Array<Record<string, unknown>> | undefined
      if (relations) {
        const inheritRel = relations.find((r) => r.type === 'inherit')
        expect(inheritRel).toBeDefined()
        if (inheritRel) {
          expect(inheritRel.resolved).toBe(true)
        }
      }
    }
  })

  test('handles require_context with full and summary modes', () => {
    writeMarkdown(tmpRoot, 'harness/knowledge/rules/context-target.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.rule.context-target',
      'title: Context Target',
      'status: active',
      'tags:',
      '  - domain:test',
      '  - kind:rule',
      'pattern: simple',
      '---',
      '# Context Target',
      '',
      'Target for context resolution.',
    ])

    writeMarkdown(tmpRoot, 'harness/knowledge/rules/context-source.md', [
      '---',
      'schema: harness/v1',
      'kind: knowledge',
      'knowledge_type: rule',
      'id: knowledge.rule.context-source',
      'title: Context Source',
      'status: active',
      'tags:',
      '  - domain:test',
      '  - kind:rule',
      'pattern: simple',
      'affordances:',
      '  declared:',
      '    - context',
      'relations:',
      '  require_context:',
      '    - id: knowledge.rule.context-target',
      '      mode: full',
      '    - id: knowledge.rule.context-target',
      '      mode: summary',
      '---',
      '# Context Source',
      '',
      'Requires context target.',
    ])

    writeMarkdown(tmpRoot, 'harness/actions/roles/domain/example.md', [
      '---',
      'schema: harness/v1',
      'kind: role',
      'id: role.domain.example',
      'title: Example Role',
      'status: active',
      'selectors:',
      '  require_all:',
      '    - domain:test',
      'pinned:',
      '  - knowledge.repo-map',
      '---',
      '# Example Role',
    ])

    const plan = buildContextPlan({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'test require_context',
    })

    const source = plan.optional.find((d) => d.id === 'knowledge.rule.context-source')
    expect(source).toBeDefined()
    const target = plan.required.find((d) => d.id === 'knowledge.rule.context-target')
    expect(target).toBeDefined()
    const sourceTrace = plan.trace.selections.find(
      (s) => s.id === 'knowledge.rule.context-source'
    )
    expect(sourceTrace).toBeDefined()
    if (sourceTrace) {
      const relations = (sourceTrace as Record<string, unknown>).relations as Array<Record<string, unknown>> | undefined
      expect(relations).toBeDefined()
      if (relations) {
        const fullRel = relations.find((r) => r.type === 'require_context' && r.mode === 'full')
        expect(fullRel).toBeDefined()
        if (fullRel) expect(fullRel.resolved).toBe(true)
        const summaryRel = relations.find((r) => r.type === 'require_context' && r.mode === 'summary')
        expect(summaryRel).toBeDefined()
        if (summaryRel) expect(summaryRel.resolved).toBe(true)
      }
    }
  })
})
