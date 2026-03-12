import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, existsSync, rmSync, mkdtempSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

describe('compile-agents-md script', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'compile-agents-md-test-'))
  })

  afterAll(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  const setupProject = (rules: Record<string, string>) => {
    const rulesDir = join(tmpDir, 'docs/design-docs/rules')
    mkdirSync(rulesDir, { recursive: true })
    for (const [name, content] of Object.entries(rules)) {
      writeFileSync(join(rulesDir, name), content)
    }
  }

  const runCompiler = () => {
    const scriptPath = resolve(process.cwd(), 'scripts/compile-agents-md.ts')
    return Bun.spawnSync(['bun', scriptPath], {
      cwd: tmpDir,
      env: { ...process.env },
    })
  }

  test('should compile rules into AGENTS.md', () => {
    setupProject({
      'rule1.md': '---\ntitle: "Rule 1"\nimpact: HIGH\nchapter: Foundations\n---\n# Rule 1\nBody 1\n\n**Avoid:**\n\n```text\nbad\n```',
      'rule2.md': '---\ntitle: "Rule 2"\nimpact: MEDIUM\nchapter: Security\n---\n# Rule 2\nBody 2',
    })

    const result = runCompiler()
    expect(result.success).toBe(true)

    const agentsPath = join(tmpDir, 'docs/design-docs/AGENTS.md')
    expect(existsSync(agentsPath)).toBe(true)

    const content = readFileSync(agentsPath, 'utf-8')
    expect(content).toContain('# Project Architecture Rules')
    expect(content).toContain('1. [Foundations](#1-foundations)')
    // The script sorts chapters based on CHAPTER_ORDER
    // Foundations is 1st, Security & Safety is 2nd (if provided as "Security & Safety")
    // If provided as "Security", it might be sorted alphabetically after the order list
    expect(content).toContain('### 1.1 Rule 1')
    expect(content).toContain('Body 1')
    expect(content).toContain('**Avoid:**')
  })
})
