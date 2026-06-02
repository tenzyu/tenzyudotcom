import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments } from './docs'
import { asStringArray as toStringArray, type HarnessDocument } from './schema'

export type SemanticSource = 'past-run' | 'knowledge' | 'unknown-term' | 'duplicate-candidate'

export type SemanticHit = {
  id: string
  path: string
  kind: string
  title: string | null
  score: number
  matchedTerms: string[]
  reason: string
  source: SemanticSource
}

export type SemanticQuery = {
  intent: string
  inputPath: string
  tokens?: string[]
  maxResults?: number
  minScore?: number
}

export type SemanticOptions = {
  projectRoot: string
  enabled?: boolean
  maxResults?: number
  minScore?: number
  kinds?: SemanticSource[]
  excludeIds?: string[]
}

export type SemanticResult = {
  enabled: boolean
  hits: SemanticHit[]
  unknownTerms: string[]
  warnings: string[]
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'was',
  'were', 'will', 'with', 'i', 'we', 'you', 'they', 'he', 'she', 'them', 'us',
  'not', 'but', 'if', 'so', 'do', 'does', 'did', 'can', 'could', 'should', 'would',
  'just', 'only', 'also', 'than', 'then', 'there', 'here', 'when', 'where', 'what',
  'how', 'why', 'which', 'who', 'all', 'any', 'some', 'no', 'yes', 'fix', 'add',
  'update', 'use', 'using', 'make', 'made', 'thing', 'things', 'item', 'items',
])

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9_\-\s/.]/g, ' ')
    .split(/\s+/)
    .map((token) => token.replace(/^[/.-]+|[/.-]+$/g, ''))
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token) && !/^\d+$/.test(token))
}

function uniq(value: string[]): string[] {
  return [...new Set(value)]
}

function readCachedDocs(projectRoot: string): HarnessDocument[] | null {
  const target = path.join(projectRoot, '.harness/generated/docs.json')
  if (!existsSync(target)) return null
  try {
    const data = JSON.parse(readFileSync(target, 'utf-8')) as Array<{
      id: string | null
      kind: string | null
      path: string
      title: string | null
      summary: string | null
      tags: string[]
      sha256: string
      frontmatter: Record<string, unknown>
      headings: string[]
    }>
    return data.map(
      (entry) =>
        ({
          relativePath: entry.path,
          absolutePath: entry.path,
          sha256: entry.sha256,
          frontmatter: entry.frontmatter,
          headings: entry.headings,
          body: '',
          raw: '',
          frontmatterRaw: '',
          links: [],
          strictness: 'lax',
          source: 'generated',
        }) as unknown as HarnessDocument,
    )
  } catch {
    return null
  }
}

function loadCorpus(projectRoot: string): HarnessDocument[] {
  return readCachedDocs(projectRoot) ?? loadHarnessDocuments(projectRoot)
}

function documentTerms(document: HarnessDocument): string[] {
  const terms: string[] = []
  const title = typeof document.frontmatter?.title === 'string' ? document.frontmatter.title : ''
  const summary = typeof document.frontmatter?.summary === 'string' ? document.frontmatter.summary : ''
  const tags = toStringArray(document.frontmatter?.tags)
  const knowledgeType = typeof document.frontmatter?.knowledge_type === 'string' ? document.frontmatter.knowledge_type : ''
  for (const heading of document.headings) terms.push(heading)
  for (const tag of tags) terms.push(tag)
  terms.push(title, summary, knowledgeType)
  return tokenize(terms.filter(Boolean).join(' '))
}

function scoreDocument(terms: string[], docTerms: string[]): { score: number; matched: string[] } {
  if (docTerms.length === 0 || terms.length === 0) return { score: 0, matched: [] }
  const docSet = new Map<string, number>()
  for (const term of docTerms) docSet.set(term, (docSet.get(term) ?? 0) + 1)
  const matched: string[] = []
  let score = 0
  for (const term of terms) {
    const count = docSet.get(term) ?? 0
    if (count > 0) {
      score += 1 + Math.log(1 + count)
      matched.push(term)
    }
  }
  return { score, matched: uniq(matched) }
}

function knowledgeBodyTerms(document: HarnessDocument): string[] {
  if (document.body) return tokenize(document.body)
  return documentTerms(document)
}

function hitFromScore(
  document: HarnessDocument,
  score: number,
  matched: string[],
  reason: string,
  source: SemanticSource,
): SemanticHit | null {
  const id = typeof document.frontmatter?.id === 'string' ? document.frontmatter.id : null
  if (!id) return null
  return {
    id,
    path: document.relativePath,
    kind: typeof document.frontmatter?.kind === 'string' ? document.frontmatter.kind : 'unknown',
    title: typeof document.frontmatter?.title === 'string' ? document.frontmatter.title : null,
    score: Number(score.toFixed(4)),
    matchedTerms: matched,
    reason,
    source,
  }
}

export function buildSemanticQuery(intent: string, inputPath: string): SemanticQuery {
  const fromIntent = tokenize(intent)
  const fromPath = tokenize(inputPath)
  return {
    intent,
    inputPath,
    tokens: uniq([...fromIntent, ...fromPath]),
  }
}

export function runSemanticExpansion(
  options: SemanticOptions,
  query: SemanticQuery,
): SemanticResult {
  const enabled = options.enabled ?? false
  const warnings: string[] = []
  if (!enabled) {
    return { enabled: false, hits: [], unknownTerms: [], warnings }
  }

  const maxResults = options.maxResults ?? 10
  const minScore = options.minScore ?? 0.5
  const kinds = options.kinds ?? ['past-run', 'knowledge', 'unknown-term', 'duplicate-candidate']
  const exclude = new Set(options.excludeIds ?? [])

  const terms = query.tokens ?? tokenize(`${query.intent} ${query.inputPath}`)
  if (terms.length === 0) {
    warnings.push('Semantic expansion skipped: no usable terms after tokenization.')
    return { enabled: true, hits: [], unknownTerms: [], warnings }
  }

  const corpus = loadCorpus(options.projectRoot)
  const knownTerms = new Set<string>()
  for (const document of corpus) {
    for (const term of documentTerms(document)) knownTerms.add(term)
  }
  const unknownTerms = terms.filter((term) => !knownTerms.has(term))

  const hits: SemanticHit[] = []
  if (kinds.includes('past-run') || kinds.includes('knowledge') || kinds.includes('duplicate-candidate')) {
    for (const document of corpus) {
      const kind = typeof document.frontmatter?.kind === 'string' ? document.frontmatter.kind : ''
      if (kind !== 'knowledge') continue
      const id = typeof document.frontmatter?.id === 'string' ? document.frontmatter.id : null
      if (!id || exclude.has(id)) continue
      const knowledgeType = typeof document.frontmatter?.knowledge_type === 'string' ? document.frontmatter.knowledge_type : null
      const source: SemanticSource = knowledgeType === 'lesson' || knowledgeType === 'adr' || knowledgeType === 'rule' || knowledgeType === 'incident' ? 'past-run' : 'knowledge'
      const scored = scoreDocument(terms, knowledgeBodyTerms(document))
      if (scored.score < minScore) continue
      const reason = source === 'past-run'
        ? `Matched ${scored.matched.length} term(s) on a past-run artifact.`
        : `Matched ${scored.matched.length} term(s) on a knowledge document.`
      const hit = hitFromScore(document, scored.score, scored.matched, reason, kinds.includes(source) ? source : 'knowledge')
      if (hit) hits.push(hit)
    }
  }

  hits.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id))
  const trimmed = hits.slice(0, maxResults)

  return { enabled: true, hits: trimmed, unknownTerms, warnings }
}

export function findDuplicateKnowledgeCandidates(
  options: SemanticOptions & { candidateId: string },
): SemanticHit[] {
  if (options.enabled === false) return []
  const corpus = loadCorpus(options.projectRoot)
  const candidate = corpus.find(
    (document) =>
      typeof document.frontmatter?.id === 'string' &&
      document.frontmatter.id === options.candidateId,
  )
  if (!candidate) return []
  const candidateTerms = knowledgeBodyTerms(candidate)
  if (candidateTerms.length === 0) return []
  const candidates: SemanticHit[] = []
  for (const document of corpus) {
    if (document.relativePath === candidate.relativePath) continue
    const id = typeof document.frontmatter?.id === 'string' ? document.frontmatter.id : null
    if (!id) continue
    const scored = scoreDocument(candidateTerms, knowledgeBodyTerms(document))
    if (scored.score < (options.minScore ?? 1.5)) continue
    const hit = hitFromScore(
      document,
      scored.score,
      scored.matched,
      `Possible duplicate of '${options.candidateId}' (jaccard-style overlap on body terms).`,
      'duplicate-candidate',
    )
    if (hit) candidates.push(hit)
  }
  return candidates.sort((left, right) => right.score - left.score)
}
