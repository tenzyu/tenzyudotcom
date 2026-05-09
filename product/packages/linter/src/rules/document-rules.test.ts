import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

describe('lint-rules script', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'lint-rules-test-'))
  })

  afterAll(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  const setupProject = (files: Record<string, string>) => {
    if (existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
    mkdirSync(tmpDir, { recursive: true })

    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = join(tmpDir, filePath)
      mkdirSync(resolve(fullPath, '..'), { recursive: true })
      writeFileSync(fullPath, content)
    }
  }

  const runLinter = () => {
    const scriptPath = resolve(process.cwd(), 'src/rules/document-rules.ts')
    const result = Bun.spawnSync(['bun', scriptPath], {
      cwd: tmpDir,
      env: { ...process.env },
    })
    return {
      success: result.success,
      output: result.stdout.toString() + result.stderr.toString(),
    }
  }

  test('should exempt design-docs AGENTS.md from frontmatter check', () => {
    setupProject({
      'docs/design-docs/AGENTS.md': '# AGENTS\n- [Rule](./rules/rule.md)',
      'docs/design-docs/rules/rule.md': '---\ntitle: Rule\nimpact: HIGH\nimpactDescription: test\ntags: a\nchapter: Foundations\n---\n# Rule',
    })

    const result = runLinter()
    expect(result.success).toBe(true)
  })

  test('should fail if rule frontmatter is missing', () => {
    setupProject({
      'docs/design-docs/AGENTS.md': '# AGENTS\n- [Rule](./rules/rule.md)',
      'docs/design-docs/rules/rule.md': '# Rule',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('Missing mandatory frontmatter')
  })

  test('should detect orphaned design-doc markdown', () => {
    setupProject({
      'docs/design-docs/AGENTS.md': '# AGENTS',
      'docs/design-docs/rules/orphan.md': '---\ntitle: Orphan\nimpact: HIGH\nimpactDescription: test\ntags: a\nchapter: Foundations\n---\n# Orphan',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('Orphaned rule document')
  })

  test('should detect broken links', () => {
    setupProject({
      'docs/design-docs/AGENTS.md': '# AGENTS\n- [Dead](./rules/missing.md)',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('Broken link')
  })

  test('should allow first heading to start at H2 for template-shaped rules', () => {
    setupProject({
      'docs/design-docs/AGENTS.md': '# AGENTS\n- [Rule](./rules/rule.md)',
      'docs/design-docs/rules/rule.md': '---\ntitle: Rule\nimpact: HIGH\nimpactDescription: test\ntags: a\nchapter: Foundations\n---\n\n## Rule\n\nbody',
    })

    const result = runLinter()
    expect(result.success).toBe(true)
  })
})
