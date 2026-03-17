import { promises as fs, existsSync } from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import pm from 'picomatch'
import { z } from 'zod'

const REPORT_ROOT = path.resolve(process.cwd(), process.argv[2] ?? '.')

const hasMeaningfulText = (text: string) => text.trim().length > 0

const FrontmatterSchema = z.object({
  title: z.string().min(1, 'title is required'),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  impactDescription: z.string().optional(),
  tags: z.string().optional(),
  chapter: z.string().optional(),
})

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name)
    if (entry.isDirectory()) {
      yield* walk(res)
    } else {
      yield res
    }
  }
}

async function validateFrontmatter(filepath: string): Promise<boolean> {
  const content = await fs.readFile(filepath, 'utf-8')
  let data
  try {
    const parsed = matter(content)
    data = parsed.data
  } catch (err: any) {
    console.error(`\x1b[31m[ERROR]\x1b[0m YAML parsing failed in: ${path.relative(REPORT_ROOT, filepath)}`)
    console.error(`  - ${err.message}`)
    return false
  }

  if (Object.keys(data).length === 0) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Missing mandatory frontmatter in: ${path.relative(REPORT_ROOT, filepath)}`)
    return false
  }

  const result = FrontmatterSchema.safeParse(data)
  if (!result.success) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Frontmatter validation failed in: ${path.relative(REPORT_ROOT, filepath)}`)
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    return false
  }

  return true
}

async function checkFreshness(filepath: string): Promise<void> {
  const stats = await fs.stat(filepath)
  const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 30 * 6
  if (stats.mtimeMs < sixMonthsAgo) {
    console.warn(`\x1b[33m[WARN]\x1b[0m Stale document (> 6 months): ${path.relative(REPORT_ROOT, filepath)}`)
  }
}

async function lintMarkdownContent(filepath: string, content: string): Promise<boolean> {
  let hasErrors = false
  const lines = content.split('\n')
  let lastHeaderLevel = 0
  let seenHeader = false
  let inCodeBlock = false
  let listMarker: string | null = null

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    const headerMatch = line.match(/^(#{1,6})\s/)
    if (headerMatch) {
      const currentLevel = headerMatch[1].length
      if (seenHeader && currentLevel > lastHeaderLevel + 1) {
        console.error(`\x1b[31m[ERROR]\x1b[0m MD001: Header level skip (${lastHeaderLevel} -> ${currentLevel}) at line ${i + 1} in ${path.relative(REPORT_ROOT, filepath)}`)
        hasErrors = true
      }
      lastHeaderLevel = currentLevel
      seenHeader = true
    }

    const listMatch = line.match(/^\s*([\*\-])\s/)
    if (listMatch && !inCodeBlock) {
      const currentMarker = listMatch[1]
      if (listMarker === null) {
        listMarker = currentMarker
      } else if (listMarker !== currentMarker) {
        console.error(`\x1b[31m[ERROR]\x1b[0m MD004: Inconsistent list marker (expected '${listMarker}', found '${currentMarker}') at line ${i + 1} in ${path.relative(REPORT_ROOT, filepath)}`)
        hasErrors = true
      }
    }

    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        if (i > 0 && lines[i - 1].trim() !== '') {
          console.error(`\x1b[31m[ERROR]\x1b[0m MD031: Fenced code block starting at line ${i + 1} should be preceded by a blank line in ${path.relative(REPORT_ROOT, filepath)}`)
          hasErrors = true
        }
        inCodeBlock = true
      } else {
        if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
          console.error(`\x1b[31m[ERROR]\x1b[0m MD031: Fenced code block ending at line ${i + 1} should be followed by a blank line in ${path.relative(REPORT_ROOT, filepath)}`)
          hasErrors = true
        }
        inCodeBlock = false
      }
    }
  }

  return hasErrors
}

async function validateReachability(designDocsDir: string) {
  const agentsMd = path.join(designDocsDir, 'AGENTS.md')
  const allMdFiles = new Set<string>()

  for await (const filepath of walk(designDocsDir)) {
    if (filepath.endsWith('.md')) {
      allMdFiles.add(filepath)
    }
  }

  const reachedFiles = new Set<string>()
  const queue: string[] = [agentsMd]
  let hasErrors = false

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || reachedFiles.has(current)) continue
    reachedFiles.add(current)

    let content = ''
    try {
      content = await fs.readFile(current, 'utf-8')
    } catch {
      continue
    }

    const linkRegex = /\[.*?\]\((?!http)(.*?)\)|`(\/docs\/design-docs\/.*?)`/g
    let match: RegExpExecArray | null
    while ((match = linkRegex.exec(content)) !== null) {
      let linkPath = match[1] || match[2]
      if (!linkPath) continue
      if (linkPath.includes('#')) {
        linkPath = linkPath.split('#')[0]
      }

      const absolutePath = linkPath.startsWith('/')
        ? path.resolve(process.cwd(), linkPath.slice(1))
        : path.resolve(path.dirname(current), linkPath)

      if (linkPath.includes('*')) {
        const isRecursive = linkPath.includes('**')
        const baseDir = isRecursive
          ? absolutePath.split('**')[0].replace(/\/$/, '')
          : path.dirname(absolutePath)
        const pattern = isRecursive
          ? linkPath.split('**').slice(1).join('**').replace(/^\//, '**') || '**/*.md'
          : path.basename(absolutePath)

        if (!existsSync(baseDir)) {
          console.error(`\x1b[31m[ERROR]\x1b[0m Directory not found for wildcard in ${path.relative(REPORT_ROOT, current)} -> ${linkPath}`)
          hasErrors = true
          continue
        }

        const isMatch = pm(isRecursive ? `**/${pattern.replace(/^\*\*\//, '')}` : pattern)
        let matchedAny = false
        const filesToCheck = isRecursive
          ? walk(baseDir)
          : (await fs.readdir(baseDir)).map((entry) => path.resolve(baseDir, entry))

        for await (const fullPath of (isRecursive ? filesToCheck : (filesToCheck as string[]))) {
          const relToSubRoot = path.relative(baseDir, fullPath)
          if (isMatch(relToSubRoot) && fullPath.endsWith('.md')) {
            queue.push(fullPath)
            matchedAny = true
          }
        }

        if (!matchedAny) {
          console.error(`\x1b[31m[ERROR]\x1b[0m No files matched wildcard in ${path.relative(REPORT_ROOT, current)} -> ${linkPath}`)
          hasErrors = true
        }
        continue
      }

      try {
        const stats = await fs.stat(absolutePath)
        if (stats.isDirectory()) {
          for await (const subFile of walk(absolutePath)) {
            if (subFile.endsWith('.md')) {
              queue.push(subFile)
            }
          }
        } else if (absolutePath.endsWith('.md')) {
          queue.push(absolutePath)
        }
      } catch {
        console.error(`\x1b[31m[ERROR]\x1b[0m Broken link in ${path.relative(REPORT_ROOT, current)} -> ${linkPath}`)
        hasErrors = true
      }
    }
  }

  for (const file of allMdFiles) {
    const filename = path.basename(file)
    if (filename === '_template.md') continue
    if (!reachedFiles.has(file)) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Orphaned rule document (unreachable from design-docs/AGENTS.md): ${path.relative(REPORT_ROOT, file)}`)
      hasErrors = true
    }
  }

  return hasErrors
}

async function run() {
  const designDocsDir = path.resolve(REPORT_ROOT, 'docs/design-docs')
  const agentsMd = path.join(designDocsDir, 'AGENTS.md')
  let hasErrors = false
  const filesToLint: string[] = []

  for await (const filepath of walk(designDocsDir)) {
    if (filepath.endsWith('.md')) {
      filesToLint.push(filepath)
    }
  }

  console.log('Linting design-doc rules frontmatter, freshness and markdown rules...')
  for (const filepath of filesToLint) {
    const filename = path.basename(filepath)
    const isAgents = filepath === agentsMd
    const isExempt = filename === '_template.md'
    if (isExempt) continue

    if (!isAgents) {
      const fmOk = await validateFrontmatter(filepath)
      if (!fmOk) hasErrors = true
    }

    await checkFreshness(filepath)

    const content = await fs.readFile(filepath, 'utf-8')
    const contentHasErrors = await lintMarkdownContent(filepath, content)
    if (contentHasErrors) hasErrors = true
  }

  console.log('Linting design-doc reachability...')
  const reachabilityErrors = await validateReachability(designDocsDir)
  if (reachabilityErrors) hasErrors = true

  if (hasErrors) {
    console.error('\x1b[31mRule linting failed.\x1b[0m')
    process.exit(1)
  }

  console.log('\x1b[32mAll design-doc rule lint checks passed!\x1b[0m')
}

run()
