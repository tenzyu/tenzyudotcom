import { describe, expect, test, beforeAll, afterAll } from 'bun:test'
import { mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

describe('docs-rename script', () => {
  let tmpDir: string

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'docs-rename-test-'))
  })

  afterAll(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  const setupProject = (files: Record<string, string>) => {
    for (const [path, content] of Object.entries(files)) {
      const fullPath = join(tmpDir, path)
      mkdirSync(resolve(fullPath, '..'), { recursive: true })
      writeFileSync(fullPath, content)
    }
  }

  const runScript = (args: string[]) => {
    const scriptPath = resolve(process.cwd(), 'scripts/docs-rename.ts')
    return Bun.spawnSync(['bun', scriptPath, ...args], {
      cwd: tmpDir,
      env: { ...process.env },
    })
  }

  test('should move a file and update references', () => {
    setupProject({
      'docs/old-name.md': '# Old Doc',
      'docs/other.md': 'See [Old Name](./old-name.md) or @docs/old-name',
      'src/component.tsx': 'Check [doc](/docs/old-name)',
    })

    const result = runScript(['docs/old-name.md', 'docs/new-name.md'])

    expect(result.success).toBe(true)
    expect(existsSync(join(tmpDir, 'docs/old-name.md'))).toBe(false)
    expect(existsSync(join(tmpDir, 'docs/new-name.md'))).toBe(true)

    const otherContent = readFileSync(join(tmpDir, 'docs/other.md'), 'utf-8')
    expect(otherContent).toContain('[Old Name](./new-name.md)')
    expect(otherContent).toContain('@docs/new-name')

    const componentContent = readFileSync(join(tmpDir, 'src/component.tsx'), 'utf-8')
    expect(componentContent).toContain('[doc](/docs/new-name)')
  })

  test('should move a directory and update references', () => {
    setupProject({
      'docs/feature/doc1.md': '# Doc 1',
      'docs/other.md': 'See [Doc 1](./feature/doc1.md) or @docs/feature/doc1',
    })

    const result = runScript(['docs/feature', 'docs/new-feature'])

    expect(result.success).toBe(true)
    expect(existsSync(join(tmpDir, 'docs/feature/doc1.md'))).toBe(false)
    expect(existsSync(join(tmpDir, 'docs/new-feature/doc1.md'))).toBe(true)

    const otherContent = readFileSync(join(tmpDir, 'docs/other.md'), 'utf-8')
    expect(otherContent).toContain('[Doc 1](./new-feature/doc1.md)')
    expect(otherContent).toContain('@docs/new-feature/doc1')
  })

  test('should handle dry-run', () => {
    setupProject({
      'docs/dry.md': '# Dry',
      'docs/other.md': 'See @docs/dry',
    })

    const result = runScript(['docs/dry.md', 'docs/wet.md', '--dry-run'])

    expect(result.success).toBe(true)
    expect(existsSync(join(tmpDir, 'docs/dry.md'))).toBe(true)
    expect(existsSync(join(tmpDir, 'docs/wet.md'))).toBe(false)

    const otherContent = readFileSync(join(tmpDir, 'docs/other.md'), 'utf-8')
    expect(otherContent).toContain('@docs/dry')
  })

  test('should handle nested directory moves and complex relative paths', () => {
    setupProject({
      'docs/a/b/c.md': '# C doc',
      'docs/other/d.md': 'Link to [C](../a/b/c.md)',
      'docs/a/b/ref-to-c.md': 'Ref to [C](./c.md)',
    })

    const result = runScript(['docs/a', 'docs/x'])

    expect(result.success).toBe(true)
    expect(existsSync(join(tmpDir, 'docs/x/b/c.md'))).toBe(true)

    // Check link from unaffected file
    const dContent = readFileSync(join(tmpDir, 'docs/other/d.md'), 'utf-8')
    expect(dContent).toContain('[C](../x/b/c.md)')

    // Check link in moved file pointing to another moved file
    const refToCContent = readFileSync(join(tmpDir, 'docs/x/b/ref-to-c.md'), 'utf-8')
    expect(refToCContent).toContain('[C](./c.md)')
  })

  test('should handle .md extension intelligently', () => {
    setupProject({
      'docs/old.md': '# Old',
      'docs/refs.md': 'Mentions @docs/old, [Link](./old), [LinkMd](./old.md)',
    })

    runScript(['docs/old.md', 'docs/new.md'])

    const refsContent = readFileSync(join(tmpDir, 'docs/refs.md'), 'utf-8')
    expect(refsContent).toContain('@docs/new,')
    expect(refsContent).toContain('[Link](./new),')
    expect(refsContent).toContain('[LinkMd](./new.md)')
  })

  test('should handle root-relative markdown links', () => {
    setupProject({
      'docs/old.md': '# Old',
      'src/other.tsx': 'Link to [Old](/docs/old)',
    })

    runScript(['docs/old.md', 'docs/new.md'])

    const otherContent = readFileSync(join(tmpDir, 'src/other.tsx'), 'utf-8')
    expect(otherContent).toContain('[Old](/docs/new)')
  })

  test('should handle moving a file within the same directory', () => {
    setupProject({
      'docs/same/dir.md': '# Same dir',
      'docs/same/other.md': 'Link to [Dir](./dir.md)',
    })

    runScript(['docs/same/dir.md', 'docs/same/new-name.md'])

    const otherContent = readFileSync(join(tmpDir, 'docs/same/other.md'), 'utf-8')
    expect(otherContent).toContain('[Dir](./new-name.md)')
    expect(existsSync(join(tmpDir, 'docs/same/dir.md'))).toBe(false)
    expect(existsSync(join(tmpDir, 'docs/same/new-name.md'))).toBe(true)
  })

  test('should update references even if the source file does not exist', () => {
    setupProject({
      'docs/other.md': 'Link to [Missing](./missing.md) or @docs/missing',
    })

    const result = runScript(['docs/missing.md', 'docs/new-location.md'])

    expect(result.success).toBe(true)
    const otherContent = readFileSync(join(tmpDir, 'docs/other.md'), 'utf-8')
    expect(otherContent).toContain('[Missing](./new-location.md)')
    expect(otherContent).toContain('@docs/new-location')
  })

  test('should handle technically broken links like ./docs/GUARDRAILS.md in a file within docs/', () => {
    setupProject({
      'docs/AGENTS.md': 'Link [G](./docs/GUARDRAILS.md)',
    })

    // old exists, but the link is "broken" (should be [G](./GUARDRAILS.md) but is [G](./docs/GUARDRAILS.md))
    const result = runScript(['docs/GUARDRAILS.md', 'docs/design-docs/GUARDRAILS.md'])

    expect(result.success).toBe(true)
    const content = readFileSync(join(tmpDir, 'docs/AGENTS.md'), 'utf-8')
    // It should correctly identify that ./docs/GUARDRAILS.md meant ROOT/docs/GUARDRAILS.md
    // And update it to the new location relative to docs/AGENTS.md
    expect(content).toContain('[G](./design-docs/GUARDRAILS.md)')
  })

  test('should update directory-level references when a directory is moved', () => {
    setupProject({
      'docs/completed/task1.md': '# Task 1',
      'docs/other.md': 'See [Completed](./completed/) or @docs/completed/task1',
    })

    // Rename directory
    const result = runScript(['docs/completed', 'docs/archive'])

    expect(result.success).toBe(true)
    const otherContent = readFileSync(join(tmpDir, 'docs/other.md'), 'utf-8')
    
    // This currently fails for the directory link
    expect(otherContent).toContain('[Completed](./archive/)')
    expect(otherContent).toContain('@docs/archive/task1')
  })
})
