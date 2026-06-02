import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildContextPreview } from '../core/context'
import { compileIndexes } from '../core/indexer'
import { promoteKnowledgeProposal, proposeKnowledge, rejectKnowledgeProposal } from '../core/knowledge'
import { closeRun, expandRunContext, initRun } from '../core/runs'

function writeMarkdown(root: string, relativePath: string, lines: string[]) {
  const target = path.join(root, relativePath)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, lines.join('\n'))
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

  test('builds role-routed context preview with reasons', () => {
    const preview = buildContextPreview({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
    })

    const requiredPaths = preview.required.map((document) => document.path)
    const optionalPaths = preview.optional.map((document) => document.path)

    expect(requiredPaths).toContain('harness/actions/workflows/example.md')
    expect(requiredPaths).toContain('harness/actions/phases/implementation.md')
    expect(requiredPaths).toContain('harness/actions/roles/domain/example.md')
    expect(requiredPaths).toContain('harness/policies/repository.md')
    expect(requiredPaths).toContain('harness/knowledge/product-specs/example/README.md')
    expect(optionalPaths).toContain('harness/knowledge/product-specs/example/optional.md')
    expect(preview.mode).toBe('compact')
    expect(preview.diagnostics).toEqual([])
  })

  test('supports linked context preview mode', () => {
    const preview = buildContextPreview({
      projectRoot: tmpRoot,
      workflowId: 'workflow.example',
      roleIds: ['role.domain.example'],
      inputPath: 'product/apps/example',
      intent: 'fix auth behavior',
      mode: 'linked',
    })

    expect(preview.mode).toBe('linked')
    expect(preview.nextCommand).toContain('--mode linked')
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
})
