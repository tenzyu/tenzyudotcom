import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { parseFrontmatter } from './frontmatter'
import type { HarnessDocument, MarkdownLink, Strictness } from './schema'

const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/g
const HEADING_PATTERN = /^(#{1,6})\s+(.+)$/gm

function toPosixPath(value: string) {
  return value.split(path.sep).join('/')
}

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex')
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return []

  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(absolutePath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(absolutePath)
    }
  }

  return files.sort((left, right) => left.localeCompare(right))
}

function extractHeadings(body: string) {
  const headings: string[] = []
  for (const match of body.matchAll(HEADING_PATTERN)) {
    const heading = match[2]?.trim()
    if (heading) headings.push(heading)
  }
  return headings
}

function lineForIndex(raw: string, index: number) {
  return raw.slice(0, index).split(/\r?\n/).length
}

export function extractMarkdownLinks(raw: string): MarkdownLink[] {
  const links: MarkdownLink[] = []

  for (const match of raw.matchAll(MARKDOWN_LINK_PATTERN)) {
    const target = match[1]?.trim()
    if (!target || match.index === undefined) continue
    links.push({
      target,
      line: lineForIndex(raw, match.index),
    })
  }

  return links
}

export function strictnessForPath(relativePath: string): Strictness {
  if (
    relativePath.startsWith('harness/actions/roles/') ||
    relativePath.startsWith('harness/actions/workflows/') ||
    relativePath.startsWith('harness/actions/phases/')
  ) {
    return 'strict'
  }

  if (relativePath.startsWith('harness/knowledge/') || relativePath.startsWith('harness/policies/')) {
    return 'indexed'
  }

  return 'loose'
}

export function loadHarnessDocuments(projectRoot: string): HarnessDocument[] {
  const harnessRoot = path.join(projectRoot, 'harness')
  const files = listMarkdownFiles(harnessRoot)

  return files.map((absolutePath) => {
    const raw = readFileSync(absolutePath, 'utf-8')
    const parsed = parseFrontmatter(raw)
    const relativePath = toPosixPath(path.relative(projectRoot, absolutePath))

    return {
      absolutePath,
      relativePath,
      raw,
      body: parsed.body,
      frontmatter: parsed.frontmatter,
      frontmatterRaw: parsed.frontmatterRaw,
      frontmatterError: parsed.error,
      sha256: sha256(raw),
      headings: extractHeadings(parsed.body),
      links: extractMarkdownLinks(raw),
      strictness: strictnessForPath(relativePath),
    }
  })
}

function withoutFragment(target: string) {
  return target.split('#')[0] ?? ''
}

function isExternalTarget(target: string) {
  return (
    target.startsWith('#') ||
    target.startsWith('http://') ||
    target.startsWith('https://') ||
    target.startsWith('mailto:') ||
    target.startsWith('app://')
  )
}

function candidatePaths(projectRoot: string, documentPath: string, target: string) {
  const cleanTarget = decodeURI(withoutFragment(target)).trim()
  if (!cleanTarget) return []

  const base = cleanTarget.startsWith('/')
    ? path.join(projectRoot, cleanTarget.slice(1))
    : path.resolve(path.dirname(documentPath), cleanTarget)

  return [base, `${base}.md`, path.join(base, 'README.md'), path.join(base, 'index.md')]
}

export function markdownLinkExists(projectRoot: string, documentPath: string, target: string) {
  if (isExternalTarget(target)) return true
  return candidatePaths(projectRoot, documentPath, target).some((candidate) => {
    try {
      return existsSync(candidate) && statSync(candidate).isFile()
    } catch {
      return false
    }
  })
}

