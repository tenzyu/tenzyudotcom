/**
 * Deterministic `SourceAnchor` generation for the Relation Kernel.
 *
 * The indexer is the only producer of anchors. Anchors are a parallel
 * artifact to `SourceUnit`: they narrow a `SourceUnit` to a specific
 * region (line range), section (heading path), symbol, script entry, or
 * test file.
 *
 * Every anchor has:
 *   - a stable `id` derived from `(kind, path, range, symbol, heading)`;
 *   - a stable `content_hash` derived from the same tuple, independently
 *     from the `id` so validators can re-hash without re-id'ing;
 *   - a `source_refs` array that ties the anchor back to disk.
 *
 * The file scan is the same scan that produces `SourceUnit` records;
 * anchors are produced from the same `ScanResult`.
 */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { deterministicId, sha256OfString, type SourceAnchor, type SourceRef } from '../../../lib/src/index.ts'
import type { ScanFileRow, ScanResult } from './scan.ts'

const MAX_READ_BYTES = 1_000_000

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Build the canonical key used for both id and content_hash. The
 * canonical key is a stable string serialisation of the parts that
 * uniquely identify the anchor. Order is fixed.
 */
function anchorCanonicalKey(
  kind: SourceAnchor['kind'],
  parts: {
    path: string
    startLine?: number
    endLine?: number
    symbolName?: string
    headingPath?: string[]
  },
): string {
  const fields = [
    `kind=${kind}`,
    `path=${parts.path}`,
    parts.startLine !== undefined ? `start=${parts.startLine}` : 'start=',
    parts.endLine !== undefined ? `end=${parts.endLine}` : 'end=',
    parts.symbolName ? `symbol=${parts.symbolName}` : 'symbol=',
    parts.headingPath && parts.headingPath.length > 0
      ? `heading=${parts.headingPath.join(' || ')}`
      : 'heading=',
  ]
  return fields.join('|')
}

function anchorContentHash(canonicalKey: string): string {
  return sha256OfString(canonicalKey)
}

function buildAnchor(
  kind: SourceAnchor['kind'],
  selectorStrategy: SourceAnchor['selector_strategy'],
  parts: {
    path: string
    startLine?: number
    endLine?: number
    symbolName?: string
    headingPath?: string[]
  },
  sourceRef: SourceRef,
  now: string,
): SourceAnchor {
  const canonical = anchorCanonicalKey(kind, parts)
  return {
    id: deterministicId('anchor', canonical),
    kind,
    path: parts.path,
    start_line: parts.startLine,
    end_line: parts.endLine,
    heading_path: parts.headingPath,
    symbol_name: parts.symbolName,
    content_hash: anchorContentHash(canonical),
    selector_strategy: selectorStrategy,
    produced_by: 'indexer',
    provenance_kind: 'deterministic_fact',
    confidence: 'fact',
    status: 'fresh',
    source_refs: [sourceRef],
    created_at: now,
  }
}

/**
 * Decide whether a path is a "test" file. Mirrors the unit-type
 * heuristic in `build.ts` so the two stay in lock-step.
 */
function isTestFile(relpath: string): boolean {
  const base = relpath.split('/').pop() ?? ''
  if (base.includes('.test.') || base.includes('.spec.')) return true
  if (relpath.includes('/test/') || relpath.startsWith('test/')) return true
  if (relpath.includes('/tests/') || relpath.startsWith('tests/')) return true
  return false
}

/**
 * Decide whether a path is "code" (so we can extract symbol
 * candidates). Restricted to the common JS/TS family.
 */
function isCodeFile(relpath: string): boolean {
  const lower = relpath.toLowerCase()
  return (
    lower.endsWith('.ts') ||
    lower.endsWith('.tsx') ||
    lower.endsWith('.js') ||
    lower.endsWith('.jsx')
  )
}

function isMarkdownFile(relpath: string): boolean {
  const lower = relpath.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.mdx')
}

function isConfigFile(relpath: string): boolean {
  const base = relpath.split('/').pop() ?? ''
  if (base === 'package.json' || base === 'tsconfig.json') return true
  if (base.endsWith('.config.js') || base.endsWith('.config.ts')) return true
  return false
}

const SYMBOL_PATTERNS: ReadonlyArray<{ regex: RegExp; kind: 'function' | 'class' | 'const' }> = [
  // top-level export function foo(...)  /  function foo(...)
  { regex: /^[ \t]*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/, kind: 'function' },
  // top-level export class Foo
  { regex: /^[ \t]*export\s+class\s+([A-Za-z_$][\w$]*)/, kind: 'class' },
  // top-level export const foo = ... | const foo = (...)
  {
    regex:
      /^[ \t]*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:\([^)]*\)|[A-Za-z_$])/,
    kind: 'const',
  },
]

/**
 * Extract a best-effort, dependency-light list of top-level symbol
 * candidates from a TypeScript/JavaScript source string.
 *
 * Returns a list of `{ name, startLine, endLine, kind }`. The kind is
 * always `code_symbol_candidate` which already encodes "uncertain" in
 * its name.
 */
function extractSymbolCandidates(
  content: string,
): Array<{ name: string; startLine: number; endLine: number; kind: string }> {
  const lines = content.split(/\r?\n/)
  const out: Array<{ name: string; startLine: number; endLine: number; kind: string }> = []
  const seen = new Set<string>()
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    for (const pat of SYMBOL_PATTERNS) {
      const m = pat.regex.exec(line)
      if (!m) continue
      const name = m[1]
      if (!name) continue
      const key = `${name}@${i + 1}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ name, startLine: i + 1, endLine: i + 1, kind: pat.kind })
      break // one match per line is enough
    }
  }
  return out
}

/**
 * Split a markdown file into a list of sections based on
 * `^#{1,6} ` heading lines.
 *
 * The first element is the "preamble" (everything before the first
 * heading) with an empty `headingPath`.
 */
function extractMarkdownSections(
  content: string,
): Array<{ headingPath: string[]; startLine: number; endLine: number }> {
  const lines = content.split(/\r?\n/)
  type Span = { headingPath: string[]; startLine: number; endLine: number }
  const spans: Span[] = []
  let current: Span | null = null
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(line)
    if (m) {
      if (current) current.endLine = i
      const title = m[2]!.trim()
      current = { headingPath: [title], startLine: i + 1, endLine: lines.length }
      spans.push(current)
    }
  }
  if (current) current.endLine = lines.length
  if (spans.length > 0 && (spans[0]?.startLine ?? 0) > 1) {
    spans.unshift({
      headingPath: [],
      startLine: 1,
      endLine: (spans[0]?.startLine ?? 1) - 1,
    })
  }
  // Walk the levels to build a hierarchical heading path per span.
  const stack: Array<{ level: number; title: string }> = []
  for (const s of spans) {
    if (s.headingPath.length === 0) continue
    const title = s.headingPath[0]!
    const headingLine = lines[s.startLine - 1] ?? ''
    const m2 = /^(#{1,6})/.exec(headingLine)
    const level = m2 ? m2[1]!.length : 1
    while (stack.length > 0 && stack[stack.length - 1]!.level >= level) stack.pop()
    stack.push({ level, title })
    s.headingPath = stack.map((h) => h.title)
  }
  return spans
}

function refForRow(row: ScanFileRow): SourceRef {
  return { path: row.relpath, sha256: row.sha256 }
}

/**
 * Read file content for anchor extraction. The read is bounded so
 * very large files (build outputs) do not blow up the heap. The
 * content cache is per-scan; we never read a file twice.
 */
async function readContent(row: ScanFileRow, cache: Map<string, string>): Promise<string> {
  const cached = cache.get(row.relpath)
  if (cached !== undefined) return cached
  if (row.size <= 0 || row.size > MAX_READ_BYTES) {
    cache.set(row.relpath, '')
    return ''
  }
  try {
    const text = await readFile(row.path, 'utf8')
    cache.set(row.relpath, text)
    return text
  } catch {
    cache.set(row.relpath, '')
    return ''
  }
}

/**
 * Build a complete deterministic anchor list from a scan result.
 *
 * The output is sorted by `(kind, path, start_line, end_line,
 * symbol_name, heading_path)` so re-runs produce identical NDJSON.
 */
export async function buildAnchors(scan: ScanResult): Promise<SourceAnchor[]> {
  const now = nowIso()
  const anchors: SourceAnchor[] = []
  const seen = new Set<string>() // dedup by id
  function push(a: SourceAnchor): void {
    if (seen.has(a.id)) return
    seen.add(a.id)
    anchors.push(a)
  }
  const cache = new Map<string, string>()

  // 1. file anchors (one per indexed file). Excluded files like
  //    `.rmeta` are already filtered by the scan's INDEXER_IGNORED_DIRS,
  //    but we also drop `.rmeta` files explicitly.
  for (const row of scan.files) {
    const base = row.relpath.split('/').pop() ?? ''
    if (base.endsWith('.rmeta')) continue
    push(
      buildAnchor('file', 'path', { path: row.relpath }, refForRow(row), now),
    )
  }

  // 2. markdown_section anchors
  for (const row of scan.files) {
    if (!isMarkdownFile(row.relpath)) continue
    const text = await readContent(row, cache)
    if (text === '') continue
    const sections = extractMarkdownSections(text)
    for (const s of sections) {
      push(
        buildAnchor(
          'markdown_section',
          s.headingPath.length > 0 ? 'heading' : 'line_range',
          {
            path: row.relpath,
            startLine: s.startLine,
            endLine: s.endLine,
            headingPath: s.headingPath.length > 0 ? s.headingPath : undefined,
          },
          refForRow(row),
          now,
        ),
      )
    }
  }

  // 3. code_symbol_candidate anchors (cheap regex on top-level decls)
  for (const row of scan.files) {
    if (!isCodeFile(row.relpath)) continue
    const text = await readContent(row, cache)
    if (text === '') continue
    for (const sym of extractSymbolCandidates(text)) {
      push(
        buildAnchor(
          'code_symbol_candidate',
          'symbol',
          {
            path: row.relpath,
            startLine: sym.startLine,
            endLine: sym.endLine,
            symbolName: sym.name,
          },
          refForRow(row),
          now,
        ),
      )
    }
  }

  // 4. test_file anchors (in addition to the file anchor)
  for (const row of scan.files) {
    if (!isTestFile(row.relpath)) continue
    push(
      buildAnchor('test_file', 'path', { path: row.relpath }, refForRow(row), now),
    )
  }

  // 5. package_script anchors
  if (scan.scripts && typeof scan.scripts === 'object') {
    const pkgRow = scan.files.find((r) => r.relpath === 'package.json')
    const pkgRef: SourceRef = pkgRow
      ? { path: 'package.json', sha256: pkgRow.sha256 }
      : { path: 'package.json', sha256: '' }
    for (const [name, command] of Object.entries(scan.scripts as Record<string, string>)) {
      // The anchor payload is the script key + its command, so changing
      // the command value changes the hash and the id.
      const hashInput = `package_script|package.json|symbol=${name}|cmd=${command}`
      const hash = createHash('sha256').update(hashInput, 'utf8').digest('hex')
      const id = deterministicId('anchor', hashInput)
      push({
        id,
        kind: 'package_script',
        path: 'package.json',
        symbol_name: name,
        content_hash: hash,
        selector_strategy: 'symbol',
        produced_by: 'indexer',
        provenance_kind: 'deterministic_fact',
        confidence: 'fact',
        status: 'fresh',
        source_refs: [pkgRef],
        created_at: now,
      })
    }
  }

  // 6. config_file anchors (in addition to the file anchor)
  for (const row of scan.files) {
    if (!isConfigFile(row.relpath)) continue
    push(
      buildAnchor('config_file', 'path', { path: row.relpath }, refForRow(row), now),
    )
  }

  // Stable sort so re-runs are byte-identical.
  anchors.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1
    if (a.path !== b.path) return a.path < b.path ? -1 : 1
    const aStart = a.start_line ?? -1
    const bStart = b.start_line ?? -1
    if (aStart !== bStart) return aStart - bStart
    const aEnd = a.end_line ?? -1
    const bEnd = b.end_line ?? -1
    if (aEnd !== bEnd) return aEnd - bEnd
    const aSym = a.symbol_name ?? ''
    const bSym = b.symbol_name ?? ''
    if (aSym !== bSym) return aSym < bSym ? -1 : 1
    const aHead = (a.heading_path ?? []).join('/')
    const bHead = (b.heading_path ?? []).join('/')
    if (aHead !== bHead) return aHead < bHead ? -1 : 1
    return a.id < b.id ? -1 : 1
  })
  return anchors
}

/**
 * Build the `by-anchor.json` index. Maps anchor id to a small
 * descriptor `{ kind, path, status }` for fast lookups.
 */
export function buildByAnchorIndex(
  anchors: ReadonlyArray<SourceAnchor>,
): Record<string, { kind: SourceAnchor['kind']; path: string; status: SourceAnchor['status'] }> {
  const out: Record<string, { kind: SourceAnchor['kind']; path: string; status: SourceAnchor['status'] }> = {}
  for (const a of anchors) {
    out[a.id] = { kind: a.kind, path: a.path, status: a.status }
  }
  return out
}
