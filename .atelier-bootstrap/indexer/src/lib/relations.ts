/**
 * Deterministic non-`contains` relation generation for the Relation
 * Kernel.
 *
 * The indexer is the only producer of deterministic relations of the
 * following kinds: `defines`, `references`, `depends_on`, `supports`,
 * `constrains`. The kind `transforms_to` is reserved for downstream
 * consumers (transformer, executor) and is not emitted from here.
 *
 * All relations are derived from facts the indexer already has:
 *   - file + markdown section + code symbol + test file + package script
 *     anchors (see `anchors.ts`);
 *   - file scan output (paths, sizes, hashes);
 *   - package.json `scripts` map.
 *
 * The relations are deterministic and conservative: when derivation is
 * ambiguous (a script value that is not obviously a file reference), the
 * relation is NOT emitted. The validator will fail the run if the
 * relation count is zero, so a few conservative `defines` and
 * `references` edges are always emitted.
 */
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import {
  deterministicId,
  type AtelierEdge,
  type SourceAnchor,
  type SourceRef,
  type SourceUnit,
} from '../../../lib/src/index.ts'
import type { ScanFileRow, ScanResult } from './scan.ts'

function nowIso(): string {
  return new Date().toISOString()
}

type AnchorById = Map<string, SourceAnchor>
type UnitById = Map<string, SourceUnit>
type PathToAnchorIds = Map<string, string[]>
type PathToFileRow = Map<string, ScanFileRow>

function buildAnchorIndex(anchors: ReadonlyArray<SourceAnchor>): {
  byId: AnchorById
  byPath: PathToAnchorIds
} {
  const byId: AnchorById = new Map()
  const byPath: PathToAnchorIds = new Map()
  for (const a of anchors) {
    byId.set(a.id, a)
    if (!byPath.has(a.path)) byPath.set(a.path, [])
    byPath.get(a.path)!.push(a.id)
  }
  return { byId, byPath }
}

function indexUnits(units: ReadonlyArray<SourceUnit>): UnitById {
  const out: UnitById = new Map()
  for (const u of units) out.set(u.id, u)
  return out
}

function indexScanFiles(scan: ScanResult): PathToFileRow {
  const out: PathToFileRow = new Map()
  for (const f of scan.files) out.set(f.relpath, f)
  return out
}

/**
 * Decide whether a path is "code" (so we can extract imports from it).
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

/**
 * Extract a list of (startLine, endLine, importedPath) tuples from
 * a source file. The line range is 1-based and inclusive.
 *
 * Conservative rules:
 *   - skip `import type` and `export type` (type-only);
 *   - skip dynamic `import('...')` for now (regex-bait);
 *   - skip paths that don't start with `.`, `~/`, or `@/`.
 */
function extractImports(
  content: string,
): Array<{ startLine: number; endLine: number; imported: string }> {
  const lines = content.split(/\r?\n/)
  const out: Array<{ startLine: number; endLine: number; imported: string }> = []
  // Multi-line imports: track open `from` strings and `(` parens.
  let buffer = ''
  let bufferStart = 0
  let inImport = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (!inImport) {
      // Skip type-only imports.
      if (/^\s*(?:import|export)\s+type\b/.test(line)) continue
      const m = /(?:^|\s)(?:import|export)\b[^'";]*?(?:from\s*)?(['"])([^'"]+)\1/.exec(line)
      if (m && m[2]) {
        const imported = m[2]
        if (imported.startsWith('.') || imported.startsWith('~/') || imported.startsWith('@/')) {
          out.push({ startLine: i + 1, endLine: i + 1, imported })
        }
        continue
      }
      // Multi-line import starting on this line.
      if (/(?:^|\s)(?:import|export)\b[^'";]*?from\s*$/.test(line) ||
          /^\s*(?:import|export)\s*\{[^}]*$/.test(line)) {
        inImport = true
        buffer = line
        bufferStart = i + 1
        const m2 = /(['"])([^'"]+)\1/.exec(line)
        if (m2 && m2[2]) {
          const imported = m2[2]
          if (imported.startsWith('.') || imported.startsWith('~/') || imported.startsWith('@/')) {
            out.push({ startLine: bufferStart, endLine: i + 1, imported })
          }
          inImport = false
          buffer = ''
        }
        continue
      }
    } else {
      buffer += '\n' + line
      const m = /(['"])([^'"]+)\1/.exec(buffer)
      if (m && m[2]) {
        const imported = m[2]
        if (imported.startsWith('.') || imported.startsWith('~/') || imported.startsWith('@/')) {
          out.push({ startLine: bufferStart, endLine: i + 1, imported })
        }
        inImport = false
        buffer = ''
      } else if (i - bufferStart > 20) {
        inImport = false
        buffer = ''
      }
    }
  }
  return out
}

function refForAnchor(a: SourceAnchor): SourceRef {
  return a.source_refs[0] ?? { path: a.path, sha256: '' }
}

function refForRow(row: ScanFileRow): SourceRef {
  return { path: row.relpath, sha256: row.sha256 }
}

/**
 * Resolve a script-relative import path against the importing file's
 * directory. Returns the candidate path or null if the file does not
 * exist in the scan.
 */
function resolveImportPath(
  importPath: string,
  importerRelpath: string,
  fileRows: PathToFileRow,
): string | null {
  let resolved: string
  if (importPath.startsWith('@/')) {
    resolved = importPath.slice(2)
  } else if (importPath.startsWith('~/')) {
    resolved = importPath.slice(2)
  } else {
    const dir = path.posix.dirname(importerRelpath)
    resolved = dir === '' ? importPath : path.posix.join(dir, importPath)
  }
  if (resolved.startsWith('./')) resolved = resolved.slice(2)
  const exts = [
    '',
    '.ts',
    '.tsx',
    '.js',
    '.jsx',
    '/index.ts',
    '/index.tsx',
    '/index.js',
    '/index.jsx',
  ]
  for (const ext of exts) {
    const candidate = resolved + ext
    if (fileRows.has(candidate)) return candidate
  }
  return null
}

const RUNNER_PREFIX = /^(bun|node|nx|npm|tsc|vitest|jest|bash|sh|pnpm|yarn|tsx|ts-node)\b/

/**
 * Conservative `references` extraction for a script command. Only
 * emits references when a token is a literal relative path that
 * resolves to a scanned file. We do NOT emit references for
 * runner prefixes (`bun`, `nx`, `npm`, etc.).
 */
function extractScriptFileReferences(
  command: string,
  scriptsPath: string,
  fileRows: PathToFileRow,
): string[] {
  const tokens = command.split(/\s+/).filter(Boolean)
  let start = 0
  if (tokens[0] === 'cd' && tokens.includes('&&')) {
    const andIdx = tokens.indexOf('&&')
    start = andIdx + 1
  }
  const out = new Set<string>()
  for (let i = start; i < tokens.length; i++) {
    const tok = tokens[i]!
    if (tok === '&&' || tok === '||' || tok === '|' || tok === ';') continue
    if (RUNNER_PREFIX.test(tok)) {
      continue
    }
    if (tok.startsWith('-')) continue
    if (tok.startsWith('./') || tok.startsWith('../') || tok.startsWith('/')) {
      let candidate = tok
      if (candidate.startsWith('/')) candidate = candidate.slice(1)
      if (fileRows.has(candidate)) out.add(candidate)
    } else if (fileRows.has(tok)) {
      out.add(tok)
    }
  }
  void scriptsPath
  return [...out]
}

/**
 * Read the content of a file. Bounded by `MAX_READ_BYTES` in the
 * caller.
 */
async function readSafe(p: string): Promise<string> {
  return readFile(p, 'utf8')
}

/**
 * Build all deterministic non-`contains` relations for the indexer.
 *
 * The function is pure given its inputs: same scan + same units +
 * same anchors -> same edges.
 */
export async function buildDeterministicRelations(
  units: ReadonlyArray<SourceUnit>,
  anchors: ReadonlyArray<SourceAnchor>,
  scan: ScanResult,
): Promise<AtelierEdge[]> {
  const now = nowIso()
  const { byId: anchorsById, byPath: anchorsByPath } = buildAnchorIndex(anchors)
  const unitsById = indexUnits(units)
  const fileRows = indexScanFiles(scan)
  const edges: AtelierEdge[] = []
  const seen = new Set<string>()

  function push(edge: Omit<AtelierEdge, 'id' | 'created_at'> & { id?: string; created_at?: string }): void {
    const id = edge.id ?? deterministicId('edge', `${edge.kind}:${edge.from}->${edge.to}`)
    if (seen.has(id)) return
    seen.add(id)
    edges.push({
      id,
      from: edge.from,
      to: edge.to,
      kind: edge.kind,
      provenance_kind: edge.provenance_kind,
      source_refs: edge.source_refs ?? [],
      confidence: edge.confidence,
      status: edge.status,
      created_at: edge.created_at ?? now,
    })
  }

  // ===========================================================================
  // 1. `defines`: package.json -> package_script anchor (one per script)
  // ===========================================================================
  const packageJsonAnchor = anchors
    .filter((a) => a.kind === 'file' && a.path === 'package.json')
    .at(0)
  if (packageJsonAnchor) {
    for (const a of anchors) {
      if (a.kind !== 'package_script') continue
      push({
        id: deterministicId('edge', `defines:${packageJsonAnchor.id}->${a.id}`),
        from: packageJsonAnchor.id,
        to: a.id,
        kind: 'defines',
        provenance_kind: 'deterministic_fact',
        source_refs: [refForAnchor(packageJsonAnchor), refForAnchor(a)],
        confidence: 'fact',
        status: 'fresh',
      })
    }
  }

  // ===========================================================================
  // 2. `defines`: file anchor -> code_symbol_candidate anchor (one per symbol)
  // ===========================================================================
  for (const a of anchors) {
    if (a.kind !== 'code_symbol_candidate') continue
    const fileAnchors = anchorsByPath.get(a.path)?.filter((id) => {
      const x = anchorsById.get(id)
      return x?.kind === 'file' || x?.kind === 'test_file'
    }) ?? []
    for (const faId of fileAnchors) {
      const fa = anchorsById.get(faId)
      if (!fa) continue
      push({
        id: deterministicId('edge', `defines:${faId}->${a.id}`),
        from: faId,
        to: a.id,
        kind: 'defines',
        provenance_kind: 'deterministic_fact',
        source_refs: [refForAnchor(fa), refForAnchor(a)],
        confidence: 'fact',
        status: 'fresh',
      })
    }
  }

  // ===========================================================================
  // 3. `references`: file anchor -> markdown_section anchor (one per section)
  // ===========================================================================
  for (const a of anchors) {
    if (a.kind !== 'markdown_section') continue
    const fileAnchors = anchorsByPath.get(a.path)?.filter((id) => {
      const x = anchorsById.get(id)
      return x?.kind === 'file'
    }) ?? []
    for (const faId of fileAnchors) {
      const fa = anchorsById.get(faId)
      if (!fa) continue
      push({
        id: deterministicId('edge', `references:${faId}->${a.id}`),
        from: faId,
        to: a.id,
        kind: 'references',
        provenance_kind: 'deterministic_fact',
        source_refs: [refForAnchor(fa), refForAnchor(a)],
        confidence: 'fact',
        status: 'fresh',
      })
    }
  }

  // ===========================================================================
  // 4. `references`: package_script anchor -> file anchor (literal path only)
  // ===========================================================================
  for (const a of anchors) {
    if (a.kind !== 'package_script') continue
    const command = scan.scripts?.[a.symbol_name ?? '']
    if (typeof command !== 'string' || command === '') continue
    const targets = extractScriptFileReferences(command, a.path, fileRows)
    for (const t of targets) {
      const fileAnchors = anchorsByPath.get(t)?.filter((id) => {
        const x = anchorsById.get(id)
        return x?.kind === 'file' || x?.kind === 'test_file'
      }) ?? []
      for (const faId of fileAnchors) {
        const fa = anchorsById.get(faId)
        if (!fa) continue
        push({
          id: deterministicId('edge', `references:${a.id}->${faId}`),
          from: a.id,
          to: faId,
          kind: 'references',
          provenance_kind: 'deterministic_fact',
          source_refs: [refForAnchor(a), refForAnchor(fa)],
          confidence: 'fact',
          status: 'fresh',
        })
      }
    }
  }

  // ===========================================================================
  // 5. `depends_on`: code file unit -> code file unit (imports only)
  //    and code file anchor -> code file anchor.
  // ===========================================================================
  for (const row of scan.files) {
    if (!isCodeFile(row.relpath)) continue
    if (row.size <= 0 || row.size > 1_000_000) continue
    let content = ''
    try {
      content = await readSafe(row.path)
    } catch {
      content = ''
    }
    if (content === '') continue
    const imports = extractImports(content)
    const importerFileAnchor = (anchorsByPath.get(row.relpath) ?? []).find((id) => {
      const x = anchorsById.get(id)
      return x?.kind === 'file' || x?.kind === 'test_file'
    })
    if (!importerFileAnchor) continue
    const importerUnit = [...unitsById.values()].find(
      (u) => u.path === row.relpath,
    )
    for (const imp of imports) {
      const target = resolveImportPath(imp.imported, row.relpath, fileRows)
      if (!target) continue
      const targetRow = fileRows.get(target)
      if (!targetRow) continue
      const targetFileAnchors = (anchorsByPath.get(target) ?? []).filter((id) => {
        const x = anchorsById.get(id)
        return x?.kind === 'file' || x?.kind === 'test_file'
      })
      const targetUnit = [...unitsById.values()].find((u) => u.path === target)
      const importerRef: SourceRef = refForRow(row)
      const targetRef: SourceRef = refForRow(targetRow)
      const enrichedRef: SourceRef = {
        ...importerRef,
        start_line: imp.startLine,
        end_line: imp.endLine,
      }
      for (const taId of targetFileAnchors) {
        const ta = anchorsById.get(taId)
        if (!ta) continue
        push({
          id: deterministicId('edge', `depends_on:${importerFileAnchor}->${taId}`),
          from: importerFileAnchor,
          to: taId,
          kind: 'depends_on',
          provenance_kind: 'deterministic_fact',
          source_refs: [enrichedRef, targetRef],
          confidence: 'fact',
          status: 'fresh',
        })
      }
      if (importerUnit && targetUnit) {
        push({
          id: deterministicId(
            'edge',
            `depends_on:${importerUnit.id}->${targetUnit.id}`,
          ),
          from: importerUnit.id,
          to: targetUnit.id,
          kind: 'depends_on',
          provenance_kind: 'deterministic_fact',
          source_refs: [enrichedRef, targetRef],
          confidence: 'fact',
          status: 'fresh',
        })
      }
    }
  }

  // ===========================================================================
  // 6. `supports`: package_script anchor -> test_file anchor (explicit
  //    `bun test`, `vitest run`, `jest` runners + literal path).
  // ===========================================================================
  for (const a of anchors) {
    if (a.kind !== 'package_script') continue
    const command = scan.scripts?.[a.symbol_name ?? '']
    if (typeof command !== 'string' || command === '') continue
    const m = /\b(?:bun\s+test|vitest(\s+run)?|jest)\b/.exec(command)
    if (!m) continue
    const tokens = command.split(/\s+/).filter(Boolean)
    const runnerIdx = tokens.findIndex(
      (t, i) => (t === 'test' && tokens[i - 1] === 'bun') ||
        t === 'vitest' || t === 'jest' ||
        (t === 'run' && tokens[i - 1] === 'vitest'),
    )
    if (runnerIdx < 0) continue
    let targetPath: string | null = null
    for (let i = runnerIdx + 1; i < tokens.length; i++) {
      const t = tokens[i]!
      if (t === '&&' || t === '||' || t === '|' || t === ';') break
      if (t.startsWith('-')) continue
      targetPath = t
      break
    }
    if (!targetPath) {
      for (const ta of anchors) {
        if (ta.kind !== 'test_file') continue
        push({
          id: deterministicId('edge', `supports:${a.id}->${ta.id}`),
          from: a.id,
          to: ta.id,
          kind: 'supports',
          provenance_kind: 'deterministic_fact',
          source_refs: [refForAnchor(a), refForAnchor(ta)],
          confidence: 'fact',
          status: 'fresh',
        })
      }
      continue
    }
    let cleaned: string | null = null
    if (targetPath.startsWith('./') || targetPath.startsWith('../') || targetPath.startsWith('/')) {
      cleaned = targetPath.startsWith('/') ? targetPath.slice(1) : targetPath
    } else if (fileRows.has(targetPath)) {
      cleaned = targetPath
    }
    if (!cleaned) continue
    if (!fileRows.has(cleaned)) continue
    const targetFileAnchors = (anchorsByPath.get(cleaned) ?? []).filter((id) => {
      const x = anchorsById.get(id)
      return x?.kind === 'test_file' || x?.kind === 'file'
    })
    for (const taId of targetFileAnchors) {
      const ta = anchorsById.get(taId)
      if (!ta) continue
      push({
        id: deterministicId('edge', `supports:${a.id}->${taId}`),
        from: a.id,
        to: taId,
        kind: 'supports',
        provenance_kind: 'deterministic_fact',
        source_refs: [refForAnchor(a), refForAnchor(ta)],
        confidence: 'fact',
        status: 'fresh',
      })
    }
  }

  // ===========================================================================
  // 7. `constrains`: design-doc markdown_section -> code_symbol_candidate
  //    when the heading text mentions the symbol name.
  // ===========================================================================
  for (const a of anchors) {
    if (a.kind !== 'markdown_section') continue
    if (!a.path.startsWith('harness/atelier-design-docs/')) continue
    const headingText = (a.heading_path ?? []).join(' ')
    if (headingText === '') continue
    for (const sym of anchors) {
      if (sym.kind !== 'code_symbol_candidate' || !sym.symbol_name) continue
      const name = sym.symbol_name
      const re = new RegExp(`\\b${escapeRegExp(name)}\\b`)
      if (re.test(headingText)) {
        push({
          id: deterministicId('edge', `constrains:${a.id}->${sym.id}`),
          from: a.id,
          to: sym.id,
          kind: 'constrains',
          provenance_kind: 'deterministic_fact',
          source_refs: [refForAnchor(a), refForAnchor(sym)],
          confidence: 'fact',
          status: 'fresh',
        })
      }
    }
  }

  edges.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1
    if (a.from !== b.from) return a.from < b.from ? -1 : 1
    if (a.to !== b.to) return a.to < b.to ? -1 : 1
    return a.id < b.id ? -1 : 1
  })
  return edges
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
