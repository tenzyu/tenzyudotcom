import { afterAll, beforeEach, describe, expect, test } from 'bun:test'
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runDoctor } from '../core/doctor'

describe('runDoctor', () => {
  const tmpRoot = mkdtempSync(path.join(tmpdir(), 'atelier-doctor-'))

  beforeEach(() => {
    rmSync(path.join(tmpRoot, 'harness'), { recursive: true, force: true })
    mkdirSync(path.join(tmpRoot, 'harness/knowledge/rules'), {
      recursive: true,
    })
    mkdirSync(path.join(tmpRoot, 'harness/actions/workflows'), {
      recursive: true,
    })
  })

  afterAll(() => {
    if (existsSync(tmpRoot)) {
      rmSync(tmpRoot, { recursive: true, force: true })
    }
  })

  test('reports duplicate IDs, broken links, and old harness paths', () => {
    writeFileSync(
      path.join(tmpRoot, 'harness/knowledge/rules/a.md'),
      [
        '---',
        'schema: harness/v1',
        'kind: knowledge',
        'id: knowledge.rule.duplicate',
        'title: A',
        '---',
        '# A',
        '[missing](./missing.md)',
        'old harness/ai-org/reference',
      ].join('\n')
    )
    writeFileSync(
      path.join(tmpRoot, 'harness/knowledge/rules/b.md'),
      [
        '---',
        'schema: harness/v1',
        'kind: knowledge',
        'id: knowledge.rule.duplicate',
        'title: B',
        '---',
        '# B',
      ].join('\n')
    )

    const report = runDoctor({ projectRoot: tmpRoot })
    const codes = report.diagnostics.map((diagnostic) => diagnostic.code)

    expect(codes).toContain('DUPLICATE_ID')
    expect(codes).toContain('BROKEN_MARKDOWN_LINK')
    expect(codes).toContain('OLD_HARNESS_AI_ORG_REFERENCE')
    expect(report.summary.errorCount).toBe(4)
  })

  test('treats missing strict role metadata as an error', () => {
    mkdirSync(path.join(tmpRoot, 'harness/actions/roles/domain'), {
      recursive: true,
    })
    writeFileSync(
      path.join(tmpRoot, 'harness/actions/roles/domain/example.md'),
      '# Role'
    )

    const report = runDoctor({ projectRoot: tmpRoot })
    const missingId = report.diagnostics.find(
      (diagnostic) => diagnostic.code === 'MISSING_ID'
    )

    expect(missingId?.severity).toBe('error')
  })

  test('reports missing workflow phases from frontmatter', () => {
    writeFileSync(
      path.join(tmpRoot, 'harness/actions/workflows/example.md'),
      [
        '---',
        'schema: harness/v1',
        'kind: workflow',
        'id: workflow.example',
        'title: Example',
        'phases:',
        '  - phase.missing',
        '---',
        '# Workflow',
      ].join('\n')
    )

    const report = runDoctor({ projectRoot: tmpRoot })
    const missingPhase = report.diagnostics.find(
      (diagnostic) => diagnostic.code === 'MISSING_PHASE'
    )

    expect(missingPhase?.severity).toBe('error')
  })
})
