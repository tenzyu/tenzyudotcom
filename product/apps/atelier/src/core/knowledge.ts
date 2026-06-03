/**
 * v1 Markdown-backed knowledge proposal/promotion; compatibility only.
 * @deprecated Use observed graph facts, reconciliation findings, candidate
 * knowledge, and optional Markdown materialization instead.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, sha256Text, toPosixPath } from './docs'
import { parseFrontmatter } from './frontmatter'
import { compileIndexes } from './indexer'
import { asStringArray, type Diagnostic, type HarnessDocument } from './schema'

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgeProposalOptions = {
  projectRoot?: string
  fromRun: string
  knowledgeType: string
  title: string
  tags?: string[]
  evidence?: string
  whyRecur?: string
  whyNotCovered?: string
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgeProposalResult = {
  proposalPath: string
  runPath: string
  diagnostics: Diagnostic[]
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgePromotionOptions = {
  projectRoot?: string
  proposalPath: string
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgePromotionResult = {
  ok: boolean
  proposalPath: string
  destinationPath: string | null
  promotedId: string | null
  duplicateCandidates: string[]
  roleBundleImpact: string[]
  diagnostics: Diagnostic[]
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgeRejectOptions = {
  projectRoot?: string
  proposalPath: string
  reason?: string
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgeRejectResult = {
  proposalPath: string
  archivedPath: string
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export type KnowledgeProposalSummary = {
  path: string
  runId: string | null
  status: 'draft' | 'archived' | 'promoted' | 'rejected' | 'unknown'
  knowledgeType: string | null
  title: string | null
  id: string | null
  proposedAt: string | null
}

type ProposalData = {
  sourceRun: string
  knowledgeType: string
  title: string
  tags: string[]
  body: string
  evidence: string
  whyRecur: string
  whyNotCovered: string
}

function slug(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return normalized || 'knowledge'
}

function yamlString(value: string) {
  return JSON.stringify(value)
}

function yamlList(values: readonly string[]) {
  if (values.length === 0) return ['  - harness']
  return values.map((value) => `  - ${yamlString(value)}`)
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function recordOf(value: unknown): Record<string, unknown> {
  if (
    value === null ||
    value === undefined ||
    typeof value !== 'object' ||
    Array.isArray(value)
  )
    return {}
  return value as Record<string, unknown>
}

function runPathFor(projectRoot: string, runId: string) {
  const active = path.join(projectRoot, 'harness/runs/active', runId)
  if (existsSync(active)) return active
  const completed = path.join(projectRoot, 'harness/runs/completed', runId)
  if (existsSync(completed)) return completed
  throw new Error(`Run was not found: ${runId}`)
}

function resolveProjectPath(projectRoot: string, maybeRelativePath: string) {
  return path.isAbsolute(maybeRelativePath) ? maybeRelativePath : path.resolve(projectRoot, maybeRelativePath)
}

function extractSection(body: string, heading: string) {
  const lines = body.split(/\r?\n/)
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`)
  if (start === -1) return ''
  const section: string[] = []
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+/.test(line)) break
    section.push(line)
  }
  return section.join('\n').trim()
}

function proposalIsSubstantive(value: string) {
  return value.trim().length > 0 && !/^TBD\b/i.test(value.trim())
}

function readProposal(proposalPath: string, displayPath: string): { data: ProposalData | null; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = []
  const raw = readFileSync(proposalPath, 'utf-8')
  const parsed = parseFrontmatter(raw)

  if (parsed.error || !parsed.frontmatter) {
    diagnostics.push({
      code: 'INVALID_KNOWLEDGE_PROPOSAL',
      severity: 'error',
      path: displayPath,
      message: `Invalid proposal frontmatter: ${parsed.error ?? 'missing frontmatter'}`,
    })
    return { data: null, diagnostics }
  }

  if (parsed.frontmatter.kind !== 'knowledge-proposal') {
    diagnostics.push({
      code: 'INVALID_KNOWLEDGE_PROPOSAL',
      severity: 'error',
      path: displayPath,
      message: 'Proposal must have frontmatter kind: knowledge-proposal',
    })
  }

  if (parsed.frontmatter.status === 'archived') {
    diagnostics.push({
      code: 'INVALID_KNOWLEDGE_PROPOSAL',
      severity: 'error',
      path: displayPath,
      message: 'Archived knowledge proposals cannot be promoted again.',
    })
  }

  const sourceRun = textOf(parsed.frontmatter.source_run)
  const knowledgeType = textOf(parsed.frontmatter.proposed_knowledge_type)
  const title = textOf(parsed.frontmatter.title)
  const tags = asStringArray(parsed.frontmatter.tags)
  const evidence = extractSection(parsed.body, 'Evidence')
  const whyRecur = extractSection(parsed.body, 'Why it should recur')
  const whyNotCovered = extractSection(parsed.body, 'Why it is not already covered')

  for (const [label, value] of [
    ['source_run', sourceRun],
    ['proposed_knowledge_type', knowledgeType],
    ['title', title],
    ['Evidence', evidence],
    ['Why it should recur', whyRecur],
    ['Why it is not already covered', whyNotCovered],
  ] as const) {
    if (proposalIsSubstantive(value)) continue
    diagnostics.push({
      code: 'INVALID_KNOWLEDGE_PROPOSAL',
      severity: 'error',
      path: displayPath,
      message: `Knowledge proposal is missing substantive ${label}.`,
    })
  }

  return {
    data: {
      sourceRun,
      knowledgeType,
      title,
      tags,
      body: parsed.body,
      evidence,
      whyRecur,
      whyNotCovered,
    },
    diagnostics,
  }
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function duplicateCandidates(documents: HarnessDocument[], proposal: ProposalData) {
  const proposalTitle = normalize(proposal.title)
  const tags = new Set(proposal.tags)
  return documents
    .filter((document) => document.frontmatter?.kind === 'knowledge')
    .filter((document) => {
      const title = textOf(document.frontmatter?.title)
      const knowledgeType = textOf(document.frontmatter?.knowledge_type)
      const documentTags = asStringArray(document.frontmatter?.tags)
      const tagOverlap = documentTags.some((tag) => tags.has(tag))
      return normalize(title) === proposalTitle || (knowledgeType === proposal.knowledgeType && tagOverlap)
    })
    .map((document) => document.relativePath)
}

/** @deprecated Use reconciliation findings and graph-aware duplicate detection instead. */
export function duplicateCandidatesWithSemantic(options: {
  documents: HarnessDocument[]
  proposal: ProposalData
  projectRoot: string
  enabled: boolean
}): { paths: string[]; semanticHits: Array<{ id: string; path: string; score: number }> } {
  const paths = duplicateCandidates(options.documents, options.proposal)
  if (!options.enabled) return { paths, semanticHits: [] }
  const proposalText = [
    options.proposal.title,
    options.proposal.evidence ?? '',
    options.proposal.whyRecur ?? '',
    options.proposal.whyNotCovered ?? '',
    options.proposal.tags.join(' '),
  ]
    .join(' ')
    .toLowerCase()
  const tokens = new Set(
    proposalText
      .replace(/[^a-z0-9_\-\s/.]/g, ' ')
      .split(/\s+/)
      .map((token) => token.replace(/^[/.-]+|[/.-]+$/g, ''))
      .filter((token) => token.length >= 4),
  )
  if (tokens.size === 0) return { paths, semanticHits: [] }

  const candidates: Array<{ id: string; path: string; score: number }> = []
  for (const document of options.documents) {
    if (document.frontmatter?.kind !== 'knowledge') continue
    const id = textOf(document.frontmatter?.id)
    if (!id) continue
    const body = document.body
    if (!body) continue
    let score = 0
    for (const token of tokens) {
      if (body.toLowerCase().includes(token)) score += 1
    }
    if (score >= 3) {
      candidates.push({ id, path: document.relativePath, score })
    }
  }
  candidates.sort((left, right) => right.score - left.score)
  return { paths, semanticHits: candidates.slice(0, 5) }
}

function destinationFor(projectRoot: string, knowledgeType: string, title: string) {
  const base = slug(title)
  const type = slug(knowledgeType)
  if (type === 'rule') return path.join(projectRoot, 'harness/knowledge/rules', `${base}.md`)
  if (type === 'known-problem') return path.join(projectRoot, 'harness/knowledge/known-problems', `${base}.md`)
  if (type === 'incident') return path.join(projectRoot, 'harness/knowledge/incidents', `${base}.md`)
  if (type === 'reference') return path.join(projectRoot, 'harness/knowledge/references', `${base}.md`)
  if (type === 'decision') return path.join(projectRoot, 'harness/knowledge/decisions', `${base}.md`)
  return path.join(projectRoot, 'harness/knowledge/proposed', type, `${base}.md`)
}

function stableKnowledgeId(existingIds: Set<string>, knowledgeType: string, title: string, sourceRun: string) {
  const base = `knowledge.${slug(knowledgeType).replaceAll('-', '_')}.${slug(title).replaceAll('-', '_')}`
  if (!existingIds.has(base)) return base
  return `${base}.${sha256Text(`${sourceRun}\0${title}`).slice(0, 8)}`
}

function roleBundleImpact(documents: HarnessDocument[], proposal: ProposalData) {
  const tags = new Set(proposal.tags)
  return documents
    .filter((document) => document.frontmatter?.kind === 'role')
    .filter((document) => {
      const selectors = document.frontmatter?.selectors
      if (selectors === null || selectors === undefined || typeof selectors !== 'object' || Array.isArray(selectors)) return false
      const selectorRecord = selectors as Record<string, unknown>
      const selectorTags = asStringArray(selectorRecord.tags)
      const selectorTypes = asStringArray(selectorRecord.knowledge_types)
      return selectorTypes.includes(proposal.knowledgeType) || selectorTags.some((tag) => tags.has(tag))
    })
    .map((document) => textOf(document.frontmatter?.id))
    .filter((id) => id.length > 0)
}

function renderPromotedKnowledge(id: string, proposal: ProposalData, relativeProposalPath: string) {
  return [
    '---',
    'schema: harness/v1',
    'kind: knowledge',
    `knowledge_type: ${yamlString(proposal.knowledgeType)}`,
    `id: ${id}`,
    `title: ${yamlString(proposal.title)}`,
    'status: active',
    `summary: ${yamlString(`Promoted from run ${proposal.sourceRun}.`)}`,
    'tags:',
    ...yamlList(proposal.tags),
    'provenance:',
    `  source_run: ${yamlString(proposal.sourceRun)}`,
    `  proposal: ${yamlString(relativeProposalPath)}`,
    `  promoted_at: ${yamlString(new Date().toISOString())}`,
    '---',
    '',
    `# ${proposal.title}`,
    '',
    '## Knowledge',
    '',
    proposal.evidence,
    '',
    '## Evidence',
    '',
    proposal.evidence,
    '',
    '## Why it should recur',
    '',
    proposal.whyRecur,
    '',
    '## Why it is not already covered',
    '',
    proposal.whyNotCovered,
  ].join('\n')
}

function markProposalArchived(proposalPath: string, block: string) {
  const raw = readFileSync(proposalPath, 'utf-8')
  const withStatus = /^status:/m.test(raw) ? raw.replace(/^status:.*$/m, 'status: archived') : raw.replace(/^---\n/, '---\nstatus: archived\n')
  writeFileSync(proposalPath, `${withStatus.trimEnd()}\n\n${block.trimEnd()}\n`)
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export function proposeKnowledge(options: KnowledgeProposalOptions): KnowledgeProposalResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const runPath = runPathFor(projectRoot, options.fromRun)
  const proposalRoot = path.join(runPath, 'knowledge-proposals')
  const tags = options.tags?.length ? options.tags : ['harness']
  const proposalPath = path.join(proposalRoot, `${slug(options.title)}.md`)

  if (existsSync(proposalPath)) {
    throw new Error(`Knowledge proposal already exists: ${toPosixPath(path.relative(projectRoot, proposalPath))}`)
  }

  mkdirSync(proposalRoot, { recursive: true })
  writeFileSync(
    proposalPath,
    [
      '---',
      'schema: harness/v1',
      'kind: knowledge-proposal',
      `id: proposal.knowledge.${slug(options.fromRun)}.${slug(options.title)}`,
      `title: ${yamlString(options.title)}`,
      'status: draft',
      `source_run: ${yamlString(options.fromRun)}`,
      `proposed_knowledge_type: ${yamlString(options.knowledgeType)}`,
      'tags:',
      ...yamlList(tags),
      '---',
      '',
      `# Knowledge Proposal: ${options.title}`,
      '',
      '## Evidence',
      '',
      options.evidence ?? 'TBD from run evidence.',
      '',
      '## Why it should recur',
      '',
      options.whyRecur ?? 'TBD by proposer before promotion.',
      '',
      '## Why it is not already covered',
      '',
      options.whyNotCovered ?? 'TBD by proposer before promotion.',
    ].join('\n') + '\n',
  )

  return {
    proposalPath,
    runPath,
    diagnostics: [],
  }
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export function promoteKnowledgeProposal(options: KnowledgePromotionOptions): KnowledgePromotionResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const proposalPath = resolveProjectPath(projectRoot, options.proposalPath)
  const relativeProposalPath = toPosixPath(path.relative(projectRoot, proposalPath))
  const diagnostics: Diagnostic[] = []

  if (!existsSync(proposalPath)) {
    diagnostics.push({
      code: 'INVALID_KNOWLEDGE_PROPOSAL',
      severity: 'error',
      path: relativeProposalPath,
      message: 'Knowledge proposal does not exist.',
    })
    return {
      ok: false,
      proposalPath,
      destinationPath: null,
      promotedId: null,
      duplicateCandidates: [],
      roleBundleImpact: [],
      diagnostics,
    }
  }

  const { data, diagnostics: proposalDiagnostics } = readProposal(proposalPath, relativeProposalPath)
  diagnostics.push(...proposalDiagnostics)
  if (!data) {
    return {
      ok: false,
      proposalPath,
      destinationPath: null,
      promotedId: null,
      duplicateCandidates: [],
      roleBundleImpact: [],
      diagnostics,
    }
  }

  const documents = loadHarnessDocuments(projectRoot)
  const duplicatePaths = duplicateCandidates(documents, data)
  for (const duplicatePath of duplicatePaths) {
    diagnostics.push({
      code: 'DUPLICATE_KNOWLEDGE_CANDIDATE',
      severity: 'warning',
      path: duplicatePath,
      message: `Existing knowledge may overlap with proposal '${data.title}'.`,
    })
  }

  if (diagnostics.some((diagnostic) => diagnostic.severity === 'error')) {
    return {
      ok: false,
      proposalPath,
      destinationPath: null,
      promotedId: null,
      duplicateCandidates: duplicatePaths,
      roleBundleImpact: roleBundleImpact(documents, data),
      diagnostics,
    }
  }

  const existingIds = new Set(
    documents.map((document) => textOf(document.frontmatter?.id)).filter((id) => id.length > 0),
  )
  const promotedId = stableKnowledgeId(existingIds, data.knowledgeType, data.title, data.sourceRun)
  const destinationPath = destinationFor(projectRoot, data.knowledgeType, data.title)
  if (existsSync(destinationPath)) {
    diagnostics.push({
      code: 'DUPLICATE_KNOWLEDGE_CANDIDATE',
      severity: 'error',
      path: toPosixPath(path.relative(projectRoot, destinationPath)),
      message: 'Promotion destination already exists.',
    })
    return {
      ok: false,
      proposalPath,
      destinationPath,
      promotedId,
      duplicateCandidates: duplicatePaths,
      roleBundleImpact: roleBundleImpact(documents, data),
      diagnostics,
    }
  }

  mkdirSync(path.dirname(destinationPath), { recursive: true })
  writeFileSync(destinationPath, `${renderPromotedKnowledge(promotedId, data, relativeProposalPath)}\n`)
  markProposalArchived(
    proposalPath,
    [
      '## Promotion Result',
      '',
      `Promoted to \`${toPosixPath(path.relative(projectRoot, destinationPath))}\`.`,
      `Promoted ID: \`${promotedId}\`.`,
    ].join('\n'),
  )
  compileIndexes({ projectRoot, write: true })

  return {
    ok: true,
    proposalPath,
    destinationPath,
    promotedId,
    duplicateCandidates: duplicatePaths,
    roleBundleImpact: roleBundleImpact(documents, data),
    diagnostics,
  }
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export function rejectKnowledgeProposal(options: KnowledgeRejectOptions): KnowledgeRejectResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const proposalPath = resolveProjectPath(projectRoot, options.proposalPath)
  if (!existsSync(proposalPath)) {
    throw new Error(`Knowledge proposal does not exist: ${options.proposalPath}`)
  }

  markProposalArchived(
    proposalPath,
    [
      '## Rejection',
      '',
      options.reason ? `Reason: ${options.reason}` : 'Reason: not recorded.',
    ].join('\n'),
  )

  const rejectedRoot = path.join(path.dirname(proposalPath), 'rejected')
  const archivedPath = path.join(rejectedRoot, path.basename(proposalPath))
  mkdirSync(rejectedRoot, { recursive: true })
  if (existsSync(archivedPath)) {
    throw new Error(`Rejected proposal archive already exists: ${toPosixPath(path.relative(projectRoot, archivedPath))}`)
  }
  renameSync(proposalPath, archivedPath)

  return {
    proposalPath,
    archivedPath,
  }
}

/** @deprecated Use graph-backed control affordance detection instead. */
export type AffordanceCheckResult = {
  id: string | null
  path: string
  declared: string[]
  suggested: string[]
  reasons: Array<{ affordance: string; reason: string }>
}

const AFFORDANCE_PATTERNS: Array<{
  affordance: string
  signals: string[]
  reason: string
}> = [
  { affordance: 'migration-candidate', signals: ['upgrade', 'migration', 'migrate', 'deprecat'], reason: 'Body mentions migration, upgrade, or deprecation' },
  { affordance: 'check-candidate', signals: ['check', 'verify', 'validate', 'test', 'lint'], reason: 'Body mentions verification or checking patterns' },
  { affordance: 'context', signals: ['context', 'knowledge', 'reference'], reason: 'Body contains contextual knowledge or references' },
  { affordance: 'skill-candidate', signals: ['skill', 'agent', 'workflow'], reason: 'Body describes agent or workflow behavior' },
  { affordance: 'adr-candidate', signals: ['decision', 'rationale', 'trade-off', 'we chose'], reason: 'Body contains decision rationale or trade-off analysis' },
  { affordance: 'implementation-reference', signals: ['```'], reason: 'Body contains code blocks suggesting implementation reference' },
  { affordance: 'design-guideline', signals: ['design', 'pattern', 'composition', 'architecture'], reason: 'Body describes design patterns or architecture' },
]

/** @deprecated Use graph-backed control affordance detection instead. */
export function suggestAffordances(document: HarnessDocument): {
  suggested: string[]
  reasons: Array<{ affordance: string; reason: string }>
} {
  const frontmatter = document.frontmatter ?? {}
  const body = document.body ?? ''
  const bodyLower = body.toLowerCase()
  const declared = new Set(asStringArray(recordOf(frontmatter.affordances).declared))
  const suggested: string[] = []
  const reasons: Array<{ affordance: string; reason: string }> = []

  for (const pattern of AFFORDANCE_PATTERNS) {
    if (declared.has(pattern.affordance)) continue
    const matched = pattern.signals.some((signal) => bodyLower.includes(signal))
    if (matched) {
      suggested.push(pattern.affordance)
      reasons.push({ affordance: pattern.affordance, reason: pattern.reason })
    }
  }

  return { suggested, reasons }
}

/** @deprecated Use graph-backed control affordance detection instead. */
export function checkAffordances(projectRoot: string, knowledgePath: string): AffordanceCheckResult {
  const fullPath = path.isAbsolute(knowledgePath)
    ? knowledgePath
    : path.resolve(projectRoot, knowledgePath)
  const documents = loadHarnessDocuments(projectRoot)
  const document = documents.find((d) => d.absolutePath === fullPath || d.relativePath === knowledgePath)

  if (!document) {
    return {
      id: null,
      path: knowledgePath,
      declared: [],
      suggested: [],
      reasons: [{ affordance: 'unknown', reason: 'Knowledge document not found' }],
    }
  }

  const frontmatter = document.frontmatter ?? {}
  const declared = asStringArray(recordOf(frontmatter.affordances).declared)
  const { suggested, reasons } = suggestAffordances(document)

  return {
    id: textOf(frontmatter.id) || null,
    path: document.relativePath,
    declared,
    suggested,
    reasons,
  }
}

/** @deprecated Use reconciliation/candidate-fact workflow instead. */
export function listKnowledgeProposals(projectRootInput: string): KnowledgeProposalSummary[] {
  const projectRoot = path.resolve(projectRootInput)
  const runsRoot = path.join(projectRoot, 'harness/runs')
  if (!existsSync(runsRoot)) return []
  const summaries: KnowledgeProposalSummary[] = []
  const visits = [path.join(runsRoot, 'active'), path.join(runsRoot, 'completed')]

  for (const root of visits) {
    if (!existsSync(root)) continue
    for (const runEntry of readdirSync(root, { withFileTypes: true })) {
      if (!runEntry.isDirectory()) continue
      const runId = runEntry.name
      const proposalsRoot = path.join(root, runId, 'knowledge-proposals')
      if (!existsSync(proposalsRoot)) continue
      collectProposalSummaries(projectRoot, proposalsRoot, runId, summaries)
    }
  }

  const crossRunRoot = path.join(projectRoot, '.harness/proposals/knowledge')
  if (existsSync(crossRunRoot)) {
    collectProposalSummaries(projectRoot, crossRunRoot, null, summaries)
  }

  return summaries.sort((left, right) => left.path.localeCompare(right.path))
}

function collectProposalSummaries(
  projectRoot: string,
  dir: string,
  runId: string | null,
  summaries: KnowledgeProposalSummary[]
) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectProposalSummaries(projectRoot, target, runId, summaries)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue
    const summary = readProposalSummary(projectRoot, target, runId)
    summaries.push(summary)
  }
}

function readProposalSummary(
  projectRoot: string,
  proposalPath: string,
  runId: string | null
): KnowledgeProposalSummary {
  const raw = readFileSync(proposalPath, 'utf-8')
  const parsed = parseFrontmatter(raw)
  const frontmatter = parsed.frontmatter ?? {}
  const status = textOf(frontmatter.status) ?? 'unknown'
  const knowledgeType = textOf(frontmatter.proposed_knowledge_type) ?? textOf(frontmatter.knowledge_type)
  return {
    path: toPosixPath(path.relative(projectRoot, proposalPath)),
    runId: textOf(frontmatter.source_run) ?? runId,
    status: status as KnowledgeProposalSummary['status'],
    knowledgeType,
    title: textOf(frontmatter.title),
    id: textOf(frontmatter.id),
    proposedAt: textOf(frontmatter.proposed_at),
  }
}
