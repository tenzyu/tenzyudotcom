/**
 * Reader RelationProposal derivation.
 *
 * Given an `AttentionSet`, this module emits schema-bound
 * `RelationProposal` records. The proposals are *deterministic* and
 * *schema-bound*: every proposal carries at least one source anchor
 * id and at least one source ref. The reader never proposes
 * `contains` (that is the indexer's job) and never references
 * build-artifact paths.
 *
 * Three proposal patterns are supported inside the attention set's
 * `selected_object_ids`:
 *
 *   1. `verifies`     - test_file anchor -> the file anchor that the
 *                       test exercises, when the test file's path
 *                       contains the target file's basename.
 *
 *   2. `references`   - markdown_section anchor -> file anchor that
 *                       lives in the repo and whose path appears in
 *                       the section's first ~2KB of text.
 *
 *   3. `supports`     - package_script anchor (a `SourceUnit` whose
 *                       `unit_type` is `config_file` named
 *                       `package.json`) -> file anchor whose path is
 *                       the explicit target of the script command.
 *
 * The output is written to `.atelier/v0/objects/relation-proposals.ndjson`.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson, writeNdjson } from '../../../lib/src/ndjson.ts'
import {
  deterministicId,
  type AttentionSet,
  type RelationProposal,
  type SourceAnchor,
  type SourceUnit,
  READER_PATHS,
} from '../../../lib/src/index.ts'
import { fileExists } from '../../../lib/src/ndjson.ts'
import {
  bestAnchorForUnit,
  bestFileAnchorForPath,
  isDefaultExcludedPath,
  loadCurrentReaderIndex,
  packageScriptAnchor,
  sourceRefForAnchor,
  validateProposalAgainstCurrentIndex,
} from './relation-safety.ts'

const ALLOWED_RELATION_KINDS: ReadonlySet<string> = new Set([
  'verifies',
  'references',
  'supports',
  'defines',
  'depends_on',
  'constrains',
  'satisfies',
  // Note: 'contains' is explicitly NOT allowed for reader proposals.
])

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Find a `SourceUnit` for the given relpath, if any.
 */
function findUnitByPath(units: ReadonlyArray<SourceUnit>, relpath: string): SourceUnit | undefined {
  return units.find((u) => u.path === relpath)
}

/**
 * Group source units by their directory.
 */
function groupByDirectory(units: ReadonlyArray<SourceUnit>): Map<string, SourceUnit[]> {
  const out = new Map<string, SourceUnit[]>()
  for (const u of units) {
    const dir = path.posix.dirname(u.path.replace(/\\/g, '/'))
    const arr = out.get(dir) ?? []
    arr.push(u)
    out.set(dir, arr)
  }
  return out
}

/**
 * Strip the test suffix from a path. `foo.test.ts` -> `foo.ts`,
 * `foo.spec.tsx` -> `foo.tsx`, `foo_test.py` -> `foo.py`,
 * `test_foo.py` -> `foo.py` (best-effort).
 */
function targetBaseForTest(testPath: string): string | null {
  const base = path.basename(testPath)
  let m = base.match(/^(.+?)\.(test|spec)\.[a-z0-9]+$/i)
  if (m) return m[1] ?? null
  m = base.match(/^test[._](.+)\.[a-z0-9]+$/i)
  if (m) return m[1] ?? null
  m = base.match(/^(.+?)[._]test\.[a-z0-9]+$/i)
  if (m) return m[1] ?? null
  return null
}

/**
 * Return the list of `SourceUnit`s in the same directory whose
 * basename (sans extension) matches the test's target base.
 */
function findTestTargetCandidates(
  testUnit: SourceUnit,
  unitsByDirectory: ReadonlyMap<string, SourceUnit[]>,
): SourceUnit[] {
  const targetBase = targetBaseForTest(testUnit.path)
  if (!targetBase) return []
  const dir = path.posix.dirname(testUnit.path.replace(/\\/g, '/'))
  const peers = unitsByDirectory.get(dir) ?? []
  return peers.filter((p) => {
    if (p.id === testUnit.id) return false
    if (p.unit_type === 'test_file') return false
    const pBase = path.basename(p.path, path.extname(p.path))
    return pBase === targetBase
  })
}

/**
 * Extract the first file path token from a string. Used for the
 * `supports` (script -> target file) pattern. We look for tokens
 * that look like repo-relative paths (start with a word char and
 * end with a known code extension) and skip options like
 * `--watch` and bare command names.
 */
const SCRIPT_PATH_REGEX = /(?:^|\s)((?:\.{0,2}\/)?[A-Za-z0-9_./-]+\.[a-z0-9]{1,5})(?=\s|$|"|')/g
const KNOWN_CODE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.rs',
  '.go',
  '.rb',
  '.java',
  '.kt',
  '.swift',
  '.c',
  '.cc',
  '.cpp',
  '.h',
  '.hpp',
])

function extractScriptTargets(command: string): string[] {
  const out = new Set<string>()
  SCRIPT_PATH_REGEX.lastIndex = 0
  for (;;) {
    const match = SCRIPT_PATH_REGEX.exec(command)
    if (!match) break
    const token = match[1] ?? ''
    if (!token) continue
    if (token.startsWith('-')) continue
    // Skip obvious non-path tokens (e.g. `vitest`, `bun`, `node`).
    const ext = path.extname(token).toLowerCase()
    if (!KNOWN_CODE_EXTS.has(ext)) continue
    out.add(token.replace(/^\.\//, ''))
  }
  return [...out]
}

/**
 * Read the head of a file (bounded).
 */
async function readHead(relpath: string, maxBytes = 2048): Promise<string> {
  try {
    const text = await readFile(relpath, 'utf8')
    return text.length > maxBytes ? text.slice(0, maxBytes) : text
  } catch {
    return ''
  }
}

/**
 * Build a `verifies` proposal: test_file -> target file.
 */
function buildVerifiesProposal(
  testUnit: SourceUnit,
  targetUnit: SourceUnit,
  testAnchor: SourceAnchor,
  targetAnchor: SourceAnchor,
): RelationProposal {
  const createdAt = nowIso()
  const id = deterministicId(
    'rp',
    `verifies:${testAnchor.id}->${targetAnchor.id}:${createdAt}`,
  )
  return {
    schema: 'atelier.relation-proposal/v1',
    proposal_id: id,
    proposed_relation: {
      from: testAnchor.id,
      to: targetAnchor.id,
      kind: 'verifies',
    },
    rationale: `test file ${testUnit.path} matches target ${targetUnit.path} by basename; lives in same directory`,
    source_anchor_ids: [testAnchor.id, targetAnchor.id],
    source_refs: [sourceRefForAnchor(testAnchor), sourceRefForAnchor(targetAnchor)],
    confidence: 'inferred',
    status: 'proposed',
    created_at: createdAt,
  }
}

/**
 * Build a `references` proposal: markdown_section -> file.
 */
function buildReferencesProposal(
  mdUnit: SourceUnit,
  targetUnit: SourceUnit,
  mdAnchor: SourceAnchor,
  targetAnchor: SourceAnchor,
  quote?: string,
): RelationProposal {
  const createdAt = nowIso()
  const id = deterministicId(
    'rp',
    `references:${mdAnchor.id}->${targetAnchor.id}:${createdAt}`,
  )
  return {
    schema: 'atelier.relation-proposal/v1',
    proposal_id: id,
    proposed_relation: {
      from: mdAnchor.id,
      to: targetAnchor.id,
      kind: 'references',
    },
    rationale: `markdown section ${mdUnit.path} mentions path ${targetUnit.path}${
      quote ? ` (first match near: ${quote.slice(0, 64)})` : ''
    }`,
    source_anchor_ids: [mdAnchor.id, targetAnchor.id],
    source_refs: [sourceRefForAnchor(mdAnchor), sourceRefForAnchor(targetAnchor)],
    confidence: 'inferred',
    status: 'proposed',
    created_at: createdAt,
  }
}

/**
 * Build a `supports` proposal: package.json script -> file.
 *
 * The "from" side of a `supports` proposal is the current
 * `package_script` SourceAnchor emitted by the indexer. The reader
 * does not synthesize script anchors.
 */
function buildSupportsProposal(
  pkgUnit: SourceUnit,
  targetUnit: SourceUnit,
  scriptAnchor: SourceAnchor,
  targetAnchor: SourceAnchor,
  scriptName: string,
  scriptCommand: string,
): RelationProposal {
  const createdAt = nowIso()
  const id = deterministicId(
    'rp',
    `supports:${scriptAnchor.id}:${scriptName}->${targetAnchor.id}:${createdAt}`,
  )
  return {
    schema: 'atelier.relation-proposal/v1',
    proposal_id: id,
    proposed_relation: {
      from: scriptAnchor.id,
      to: targetAnchor.id,
      kind: 'supports',
    },
    rationale: `package.json script "${scriptName}" (${scriptCommand}) references ${targetUnit.path}`,
    source_anchor_ids: [scriptAnchor.id, targetAnchor.id],
    source_refs: [sourceRefForAnchor(scriptAnchor), sourceRefForAnchor(targetAnchor)],
    confidence: 'inferred',
    status: 'proposed',
    created_at: createdAt,
  }
}

/**
 * Read the package.json scripts block from disk.
 */
async function readPackageScripts(pkgPath: string): Promise<Record<string, string>> {
  try {
    const text = await readFile(pkgPath, 'utf8')
    const parsed = JSON.parse(text) as { scripts?: Record<string, string> }
    return parsed.scripts ?? {}
  } catch {
    return {}
  }
}

/**
 * Derive deterministic relation proposals for an attention set.
 *
 * The proposals are written to
 * `.atelier/v0/objects/relation-proposals.ndjson`. Existing
 * proposals with the same `(from, to, kind, confidence)` tuple are
 * kept; new proposals are appended.
 */
export async function deriveRelationProposals(attentionId: string): Promise<{
  attentionId: string
  added: number
  total: number
  byKind: Record<string, number>
}> {
  const all = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const target = all.find((a) => a.id === attentionId)
  if (!target) {
    throw new Error(`attention set not found: ${attentionId}`)
  }
  // Build a working set of source units limited to the attention
  // set's selected ids. Other units are still needed for the
  // markdown-reference and script-target lookups, but we filter
  // build artifacts out of both sets.
  const currentIndex = await loadCurrentReaderIndex()
  const allUnits = currentIndex.units
  const acceptableUnits = allUnits.filter(
    (u) => !isDefaultExcludedPath(u.path),
  )
  const unitIdsInAttention = new Set(
    target.selected_object_ids.filter((id) => acceptableUnits.some((u) => u.id === id)),
  )
  // The full set of acceptable units is what we search for
  // targets. The attention set narrows the *from* side: a proposal
  // is only emitted when the from-side anchor is in the attention
  // set.
  const candidates = acceptableUnits.filter((u) => unitIdsInAttention.has(u.id))
  const targets = acceptableUnits
  const unitsByDirectory = groupByDirectory(acceptableUnits)
  const proposals: RelationProposal[] = []

  // 1. `verifies`: for each test_file in the attention set, find the
  //    target file in the same directory with a matching basename.
  for (const testUnit of candidates) {
    if (testUnit.unit_type !== 'test_file') continue
    if (isDefaultExcludedPath(testUnit.path)) continue
    const testAnchor = bestAnchorForUnit(currentIndex, testUnit)
    if (!testAnchor) continue
    const peerTargets = findTestTargetCandidates(testUnit, unitsByDirectory)
    for (const t of peerTargets) {
      if (isDefaultExcludedPath(t.path)) continue
      const targetAnchor = bestFileAnchorForPath(currentIndex, t.path, ['file', 'code_symbol_candidate'])
      if (!targetAnchor) continue
      proposals.push(buildVerifiesProposal(testUnit, t, testAnchor, targetAnchor))
    }
  }

  // 2. `references`: for each markdown section in the attention
  //    set, scan the section's first ~2KB of text for a literal
  //    path token that matches an indexed file in the repo.
  for (const mdUnit of candidates) {
    const isMd =
      mdUnit.unit_type === 'markdown_section' ||
      mdUnit.unit_type === 'docs_file' ||
      mdUnit.path.toLowerCase().endsWith('.md') ||
      mdUnit.path.toLowerCase().endsWith('.mdx')
    if (!isMd) continue
    if (isDefaultExcludedPath(mdUnit.path)) continue
    const mdAnchor = bestAnchorForUnit(currentIndex, mdUnit)
    if (!mdAnchor) continue
    const head = await readHead(mdUnit.path, 2048)
    if (head.length === 0) continue
    for (const target of targets) {
      if (target.id === mdUnit.id) continue
      if (isDefaultExcludedPath(target.path)) continue
      // Only match against the path as a literal substring; avoid
      // matching `.` against itself. Cap path length to keep the
      // inner loop cheap.
      if (target.path.length < 2) continue
      if (target.path.length > 256) continue
      const idx = head.indexOf(target.path)
      if (idx < 0) continue
      const quote = head.slice(Math.max(0, idx - 32), idx + target.path.length + 32)
      const targetAnchor = bestFileAnchorForPath(currentIndex, target.path)
      if (!targetAnchor) continue
      proposals.push(buildReferencesProposal(mdUnit, target, mdAnchor, targetAnchor, quote))
    }
  }

  // 3. `supports`: for each package.json unit in the attention
  //    set, parse its `scripts` and emit one proposal per
  //    path-shaped script argument that points at an indexed file.
  for (const pkgUnit of candidates) {
    if (path.basename(pkgUnit.path) !== 'package.json') continue
    if (isDefaultExcludedPath(pkgUnit.path)) continue
    const scripts = await readPackageScripts(pkgUnit.path)
    for (const [name, cmd] of Object.entries(scripts)) {
      if (typeof cmd !== 'string') continue
      const scriptAnchor = packageScriptAnchor(currentIndex, name, pkgUnit.path)
      if (!scriptAnchor) continue
      const scriptTargets = extractScriptTargets(cmd)
      for (const t of scriptTargets) {
        const targetUnit = findUnitByPath(targets, t)
        if (!targetUnit) continue
        if (isDefaultExcludedPath(targetUnit.path)) continue
        const targetAnchor = bestFileAnchorForPath(currentIndex, targetUnit.path, ['test_file', 'file'])
        if (!targetAnchor) continue
        proposals.push(buildSupportsProposal(pkgUnit, targetUnit, scriptAnchor, targetAnchor, name, cmd))
      }
    }
  }

  // Filter out proposals whose `proposed_relation.kind` is not in
  // the allowed set. The reader contract explicitly forbids
  // `contains`.
  const filtered = proposals.filter((p) =>
    ALLOWED_RELATION_KINDS.has(p.proposed_relation.kind) &&
    validateProposalAgainstCurrentIndex(currentIndex, p).length === 0,
  )

  // Load existing proposals and dedupe by
  // (from, to, kind, confidence). Re-running derive() is
  // idempotent.
  const existing = (await readNdjson<RelationProposal>(READER_PATHS.relationProposals))
    .filter((p) => validateProposalAgainstCurrentIndex(currentIndex, p).length === 0)
  const seen = new Set<string>()
  const merged: RelationProposal[] = []
  const dedupeKey = (p: RelationProposal): string =>
    `${p.proposed_relation.from}|${p.proposed_relation.to}|${p.proposed_relation.kind}|${p.confidence}`
  for (const p of [...existing, ...filtered]) {
    const key = dedupeKey(p)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(p)
  }
  const fileExistsAlready = await fileExists(READER_PATHS.relationProposals)
  if (merged.length > 0 || !fileExistsAlready) {
    await writeNdjson(READER_PATHS.relationProposals, merged)
  }
  const byKind: Record<string, number> = {}
  for (const p of merged) {
    byKind[p.proposed_relation.kind] = (byKind[p.proposed_relation.kind] ?? 0) + 1
  }
  return {
    attentionId: target.id,
    added: filtered.length,
    total: merged.length,
    byKind,
  }
}

/**
 * Read the relation-proposals file. Returns an empty array if the
 * file is missing.
 */
export async function readRelationProposals(): Promise<RelationProposal[]> {
  return readNdjson<RelationProposal>(READER_PATHS.relationProposals)
}

/**
 * The set of relation kinds the reader is allowed to propose.
 * Exposed for tests and for the validator.
 */
export const READER_ALLOWED_RELATION_KINDS: ReadonlySet<string> = ALLOWED_RELATION_KINDS
