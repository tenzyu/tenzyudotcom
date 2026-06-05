/**
 * Reader rendering and validation.
 *
 * Render produces the human-readable Markdown views for the reader's
 * objects. Validate checks every contract obligation.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { readNdjson } from '../../../lib/src/ndjson.ts'
import {
  type AttentionSet,
  type KnowledgeObject,
  type SemanticClaim,
  INDEXER_PATHS,
  READER_PATHS,
} from '../../../lib/src/index.ts'
import { readJson } from '../../../lib/src/json.ts'
import { writeText } from '../../../lib/src/json.ts'

const GENERATED_MARKER = '<!-- GENERATED FILE. DO NOT EDIT DIRECTLY. -->'

function header(title: string, source: string): string {
  return [
    GENERATED_MARKER,
    `# ${title}`,
    '',
    `Source: \`${source}\``,
    `Generated: ${new Date().toISOString()}`,
    '',
  ].join('\n')
}

async function readProjectBriefMarkdown(): Promise<string> {
  try {
    const text = await readFile(READER_PATHS.projectBrief, 'utf8')
    return text
  } catch {
    return '_no project brief yet_'
  }
}

export async function renderProjectBriefView(): Promise<string> {
  const yaml = await readProjectBriefMarkdown()
  const out: string[] = [header('PROJECT_BRIEF', 'atelier-reader sample')]
  out.push('## Project brief (YAML)')
  out.push('```yaml')
  out.push(yaml)
  out.push('```')
  out.push('')
  return out.join('\n')
}

export async function renderAttentionSetsView(): Promise<string> {
  const sets = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const out: string[] = [header('ATTENTION_SETS', 'atelier-reader attention')]
  out.push(`Total sets: ${sets.length}`)
  out.push('')
  for (const s of sets) {
    out.push(`## ${s.id}`)
    out.push(`- task: ${s.task}`)
    out.push(`- reason: ${s.reason}`)
    out.push(`- selected: ${s.selected_object_ids.length}`)
    out.push(`- gap_status: ${s.gap_status}`)
    out.push(`- budget: ${s.budget.target_tokens} target / ${s.budget.max_tokens} max`)
    if (s.selected_source_refs.length > 0) {
      out.push('- selected source_refs:')
      for (const r of s.selected_source_refs.slice(0, 10)) {
        out.push(`  - \`${r.path}\``)
      }
      if (s.selected_source_refs.length > 10) {
        out.push(`  - ... ${s.selected_source_refs.length - 10} more`)
      }
    }
    out.push('')
  }
  return out.join('\n')
}

export async function renderKnowledgeView(): Promise<string> {
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  const semantics = await readNdjson<SemanticClaim>(READER_PATHS.semantics)
  const out: string[] = [header('KNOWLEDGE_OBJECTS', 'atelier-reader deep-read')]
  out.push(`## Knowledge objects: ${knowledge.length}`)
  for (const k of knowledge.slice(0, 50)) {
    out.push(`### ${k.title}`)
    out.push(`- id: \`${k.id}\``)
    out.push(`- knowledge_type: ${k.knowledge_type}`)
    out.push(`- confidence: ${k.confidence}`)
    out.push(`- affordances: ${k.affordances.join(', ')}`)
    out.push(`- summary: ${k.summary}`)
    if (k.source_refs.length > 0) {
      out.push(`- source_refs:`)
      for (const r of k.source_refs) out.push(`  - \`${r.path}\``)
    }
    out.push('')
  }
  if (knowledge.length > 50) out.push(`_... ${knowledge.length - 50} more_\n`)
  out.push(`## Semantic claims: ${semantics.length}`)
  for (const s of semantics.slice(0, 50)) {
    out.push(`- (${s.claim_type}) ${s.text}`)
  }
  if (semantics.length > 50) out.push(`_... ${semantics.length - 50} more_`)
  out.push('')
  return out.join('\n')
}

export async function renderAll(): Promise<{ files: string[] }> {
  await mkdir(path.dirname(READER_PATHS.projectBriefView), { recursive: true })
  const brief = await renderProjectBriefView()
  const att = await renderAttentionSetsView()
  const ko = await renderKnowledgeView()
  await writeText(READER_PATHS.projectBriefView, brief)
  await writeText(READER_PATHS.attentionView, att)
  await writeText(READER_PATHS.knowledgeView, ko)
  return {
    files: [READER_PATHS.projectBriefView, READER_PATHS.attentionView, READER_PATHS.knowledgeView],
  }
}

export type ValidationIssue = {
  severity: 'P0' | 'P1' | 'P2'
  code: string
  message: string
  affected_record?: string
  recommended_next_action?: string
}

export async function validateReader(): Promise<{ issues: ValidationIssue[]; warnings: string[]; stats: unknown }> {
  const issues: ValidationIssue[] = []
  const warnings: string[] = []

  // 1. project brief must exist and be hypothesis-only
  let briefText: string | null = null
  try {
    briefText = await readFile(READER_PATHS.projectBrief, 'utf8')
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      issues.push({
        severity: 'P0',
        code: 'E_BRIEF_MISSING',
        message: 'project brief is missing',
        recommended_next_action: 'run `bun run sample`',
      })
    }
  }
  if (briefText && !briefText.includes('status: hypothesis')) {
    issues.push({
      severity: 'P0',
      code: 'E_BRIEF_NOT_HYPOTHESIS',
      message: 'project brief does not declare status: hypothesis',
      affected_record: READER_PATHS.projectBrief,
    })
  }

  // 2. attention sets reference real objects
  const att = await readNdjson<AttentionSet>(READER_PATHS.attention)
  const units = await readNdjson<{ id: string }>(INDEXER_PATHS.objectsSource)
  const ids = new Set(units.map((u) => u.id))
  for (const a of att) {
    for (const sid of a.selected_object_ids) {
      if (!ids.has(sid)) {
        issues.push({
          severity: 'P1',
          code: 'E_ATTENTION_MISSING_OBJECT',
          message: `attention set ${a.id} references missing object ${sid}`,
          affected_record: a.id,
        })
      }
    }
    if (a.provenance_kind !== 'llm_extracted') {
      issues.push({
        severity: 'P1',
        code: 'E_ATTENTION_PROVENANCE',
        message: `attention set ${a.id} has provenance ${a.provenance_kind} (expected llm_extracted)`,
        affected_record: a.id,
      })
    }
  }

  // 3. LLM-derived records carry provenance and source refs
  const knowledge = await readNdjson<KnowledgeObject>(READER_PATHS.knowledge)
  for (const k of knowledge) {
    if (k.provenance_kind !== 'llm_extracted') {
      issues.push({
        severity: 'P1',
        code: 'E_KNOWLEDGE_PROVENANCE',
        message: `knowledge object ${k.id} has provenance ${k.provenance_kind} (expected llm_extracted)`,
        affected_record: k.id,
      })
    }
    if (k.source_refs.length === 0) {
      issues.push({
        severity: 'P1',
        code: 'E_KNOWLEDGE_SOURCES',
        message: `knowledge object ${k.id} has no source_refs`,
        affected_record: k.id,
      })
    }
  }
  const semantics = await readNdjson<SemanticClaim>(READER_PATHS.semantics)
  for (const s of semantics) {
    if (s.source_refs.length === 0) {
      issues.push({
        severity: 'P1',
        code: 'E_SEMANTICS_SOURCES',
        message: `semantic claim ${s.id} has no source_refs`,
        affected_record: s.id,
      })
    }
  }

  // 4. deep read must not read all source units
  if (att.length > 0) {
    const totalSelected = att.reduce((acc, a) => acc + a.selected_object_ids.length, 0)
    if (totalSelected >= units.length) {
      issues.push({
        severity: 'P0',
        code: 'E_DEEPREAD_NOT_SCOPED',
        message: `deep-read touched all source units (${totalSelected} >= ${units.length})`,
        recommended_next_action: 'tighten the attention set selection',
      })
    }
  }

  // 5. views exist and have the generated marker
  for (const vf of [READER_PATHS.projectBriefView, READER_PATHS.attentionView, READER_PATHS.knowledgeView]) {
    try {
      const text = await readFile(vf, 'utf8')
      if (!text.includes('GENERATED FILE. DO NOT EDIT DIRECTLY.')) {
        issues.push({
          severity: 'P1',
          code: 'E_VIEW_STALE_MARKER',
          message: `view ${vf} missing generated marker`,
          affected_record: vf,
          recommended_next_action: 'rerun `bun run render`',
        })
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        warnings.push(`view ${vf} missing; run \`bun run render\``)
      }
    }
  }

  // 6. knowledge.json must NOT be the source of truth for an LLM. It must
  //    have source_refs and provenance (already checked).
  void writeFile

  return {
    issues,
    warnings,
    stats: {
      attention_sets: att.length,
      knowledge_objects: knowledge.length,
      semantic_claims: semantics.length,
    },
  }
}
