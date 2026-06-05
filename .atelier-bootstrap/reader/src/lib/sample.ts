/**
 * Sampler for cheap semantic sampling.
 *
 * Reads a small representative set of files and emits a `ProjectBrief`
 * envelope. The function is deterministic: given the same source tree
 * the same brief is produced.
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import { readJson } from '../../../lib/src/json.ts'
import { deterministicId, type SourceUnit, INDEXER_PATHS, READER_PATHS } from '../../../lib/src/index.ts'
import type { ProjectBrief, ProjectHypothesis } from './types.ts'
import { emitYaml } from '../../../lib/src/yaml.ts'

/**
 * The "cheap" set of files: a small, deterministic selection.
 *
 * We deliberately keep this list small so cheap sampling does not become
 * a full repository read. The brief is hypothesis-only.
 */
export function selectCheapSample(units: ReadonlyArray<SourceUnit>): SourceUnit[] {
  const wanted = new Set<string>([
    'README.md',
    'package.json',
    'tsconfig.json',
  ])
  const out: SourceUnit[] = []
  for (const u of units) {
    if (wanted.has(u.path)) out.push(u)
  }
  // Add one TypeScript and one Markdown if present (cheap variety).
  let tsPicked = false
  let mdPicked = false
  for (const u of units) {
    if (!tsPicked && u.unit_type === 'symbol_candidate') {
      out.push(u)
      tsPicked = true
    }
    if (!mdPicked && (u.unit_type === 'markdown_section' || u.unit_type === 'docs_file')) {
      out.push(u)
      mdPicked = true
    }
    if (tsPicked && mdPicked) break
  }
  return out
}

async function readHead(relpath: string, maxBytes = 2048): Promise<string> {
  try {
    const text = await readFile(relpath, 'utf8')
    return text.length > maxBytes ? text.slice(0, maxBytes) : text
  } catch {
    return ''
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Build a hypothesis-only `ProjectBrief` from the cheap sample.
 *
 * The brief MUST be marked `status: hypothesis`. The reader is not allowed
 * to claim full project understanding during cheap sampling.
 */
export async function buildProjectBrief(rootDir: string): Promise<ProjectBrief> {
  void rootDir
  const units = await readNdjson<SourceUnit>(INDEXER_PATHS.objectsSource)
  const sample = selectCheapSample(units)
  const observedFacts: ProjectBrief['observed_facts'] = []
  const hypotheses: ProjectBrief['hypotheses'] = []
  const unresolved: string[] = []
  const pkg = (await readJson(path.join(process.cwd(), 'package.json'))) as
    | { name?: string; packageManager?: string; workspaces?: unknown; scripts?: Record<string, string> }
    | null

  if (pkg) {
    observedFacts.push({
      fact: `package.json present: name=${pkg.name ?? 'unknown'}`,
      source_refs: [{ path: 'package.json', sha256: units.find((u) => u.path === 'package.json')?.sha256 ?? '' }],
    })
    if (pkg.packageManager) {
      observedFacts.push({
        fact: `package manager: ${pkg.packageManager}`,
        source_refs: [{ path: 'package.json', sha256: units.find((u) => u.path === 'package.json')?.sha256 ?? '' }],
      })
    }
    if (pkg.workspaces) {
      observedFacts.push({
        fact: 'workspaces declared',
        source_refs: [{ path: 'package.json', sha256: units.find((u) => u.path === 'package.json')?.sha256 ?? '' }],
      })
    }
  }

  for (const u of sample.slice(0, 3)) {
    const head = await readHead(u.path, 256)
    if (head.length > 0) {
      hypotheses.push({
        id: deterministicId('hyp', `${u.path}:${head.slice(0, 64)}`),
        statement: `head-of ${u.path} is plausible: ${head.slice(0, 80).replace(/\s+/g, ' ').trim()}`,
        confidence: 'low',
        evidence: [u.path],
      })
    }
  }

  if (pkg && pkg.scripts) {
    const scriptNames = Object.keys(pkg.scripts)
    if (scriptNames.includes('test')) {
      hypotheses.push({
        id: deterministicId('hyp', 'has-test-script'),
        statement: 'project runs a test script',
        confidence: 'high',
        evidence: ['package.json'],
      })
    }
  }

  if (hypotheses.length === 0) {
    unresolved.push('no representative files found; rerun the indexer')
  }

  return {
    schema: 'atelier.project-brief/v1',
    status: 'hypothesis',
    generated_at: nowIso(),
    observed_facts: observedFacts,
    hypotheses,
    unresolved_questions: unresolved,
  }
}

/**
 * Persist the project brief to disk.
 */
export async function persistProjectBrief(brief: ProjectBrief): Promise<{
  yamlPath: string
  ndjsonPath: string
}> {
  const yaml = emitYaml({
    schema: brief.schema,
    status: brief.status,
    generated_at: brief.generated_at,
    observed_facts: brief.observed_facts,
    hypotheses: brief.hypotheses,
    unresolved_questions: brief.unresolved_questions,
  })
  const { writeText } = await import('../../../lib/src/json.ts')
  const { writeNdjson } = await import('../../../lib/src/ndjson.ts')
  await writeText(READER_PATHS.projectBrief, yaml)
  const hypRows: ProjectHypothesis[] = brief.hypotheses
  await writeNdjson(READER_PATHS.hypotheses, hypRows)
  return { yamlPath: READER_PATHS.projectBrief, ndjsonPath: READER_PATHS.hypotheses }
}
