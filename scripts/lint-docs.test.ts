import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

describe('lint-docs script', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'lint-docs-test-'))
  })

  afterAll(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  const setupProject = (files: Record<string, string>) => {
    // Clear the tmpDir for each test to avoid interference
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
    const scriptPath = resolve(process.cwd(), 'scripts/lint-docs.ts')
    const result = Bun.spawnSync(['bun', scriptPath], {
      cwd: tmpDir,
      env: { ...process.env },
    })
    return {
      success: result.success,
      output: result.stdout.toString() + result.stderr.toString(),
    }
  }

  test('should exempt AGENTS.md from frontmatter check', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- [Doc](./docs/doc.md)',
      'docs/doc.md': '---\nname: doc\ndescription: test\nread_when:\n  - task\n---\n# Doc',
    })

    const result = runLinter()
    expect(result.success).toBe(true)
  })

  test('should fail if frontmatter is missing in docs/', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- [No FM](./docs/no-fm.md)',
      'docs/no-fm.md': '# No Frontmatter',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('Missing mandatory frontmatter')
  })

  test('should detect orphaned documents', () => {
    setupProject({
      'AGENTS.md': '# AGENTS',
      'docs/orphan.md': '---\nname: orphan\ndescription: test\nread_when:\n  - task\n---\n# Orphan',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('Orphaned document')
  })

  test('should handle recursive wildcards', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- `/docs/features/**/*.md`',
      'docs/features/a/b/c.md': '---\nname: c\ndescription: test\nread_when:\n  - task\n---\n# C',
    })

    const result = runLinter()
    expect(result.success).toBe(true)
  })

  test('should handle Smart Path Resolution (./docs/ fallback)', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- [Doc](./docs/sub/target.md)',
      'docs/sub/target.md': '---\nname: target\ndescription: test\nread_when:\n  - task\n---\n# Target\n[Broken Link](./docs/other.md)',
      'docs/other.md': '---\nname: other\ndescription: test\nread_when:\n  - task\n---\n# Other',
    })

    const result = runLinter()
    expect(result.success).toBe(true)
  })

  test('should detect broken links', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- [Dead](./docs/dead.md)',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('Broken link')
  })

  test('should validate markdown rules (MD001)', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- [Bad](./docs/bad.md)',
      'docs/bad.md': '---\nname: bad\ndescription: test\nread_when:\n  - task\n---\n# H1\n### H3',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('MD001: Header level skip')
  })

  test('should validate execution-ready plans', () => {
    setupProject({
      'AGENTS.md': '# AGENTS\n- `/docs/exec-plans/active/*.md`',
      'docs/exec-plans/active/plan.md': '---\nname: plan\ndescription: test\nread_when:\n  - task\nexecution-ready: true\n---\n# Plan\n## Goal\n- Goal 1',
    })

    const result = runLinter()
    expect(result.success).toBe(false)
    expect(result.output).toContain('execution-ready plan is missing')
  })
})
