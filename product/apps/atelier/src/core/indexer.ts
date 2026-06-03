/**
 * v1 generated-index compiler; compatibility only.
 * @deprecated Use {@link scanProject}, {@link buildGraph}, {@link writeGraph}
 * and graph projection/materializer instead.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments } from './docs'
import { runDoctor } from './doctor'
import { buildGraph, isGraphStale, readGraph, writeGraph } from './graph'
import { compilePathOwnership, compileRepoMap } from './repo-map'
import {
  asStringArray,
  type DoctorSummary,
  type HarnessDocument,
} from './schema'

/** @deprecated Use graph projection/materializer instead. */
export type GeneratedFileName =
  | 'docs.json'
  | 'ids.json'
  | 'knowledge-index.json'
  | 'workflow-index.json'
  | 'role-bundles.json'
  | 'diagnostics.json'
  | 'repo-map.json'
  | 'path-ownership.json'

/** @deprecated Use graph operations instead. */
export type IndexOptions = {
  projectRoot?: string
  check?: boolean
  write?: boolean
}

/** @deprecated Use graph projection/materializer instead. */
export type IndexResult = {
  ok: boolean
  generatedRoot: string
  staleFiles: string[]
  diagnosticSummary: DoctorSummary
  files: Record<GeneratedFileName, string>
}

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : undefined
}

function booleanOf(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
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

function sortedObject<T>(entries: Iterable<[string, T]>) {
  return Object.fromEntries(
    [...entries].sort(([left], [right]) => left.localeCompare(right))
  )
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value === null || typeof value !== 'object') return value
  return sortedObject(
    Object.entries(value).map(([key, inner]) => [key, stable(inner)])
  )
}

function stringify(value: unknown) {
  return `${JSON.stringify(stable(value), null, 2)}\n`
}

function groupedPush<T>(map: Map<string, T[]>, key: string, value: T) {
  const values = map.get(key) ?? []
  values.push(value)
  map.set(key, values)
}

function docSummary(document: HarnessDocument) {
  return {
    id: idOf(document),
    kind: textOf(document.frontmatter?.kind),
    path: document.relativePath,
    title: textOf(document.frontmatter?.title),
    status: textOf(document.frontmatter?.status),
    summary: textOf(document.frontmatter?.summary),
    tags: asStringArray(document.frontmatter?.tags),
    sha256: document.sha256,
  }
}

function compileDocs(documents: HarnessDocument[]) {
  return documents.map((document) => ({
    ...docSummary(document),
    frontmatter: document.frontmatter,
    headings: document.headings,
  }))
}

function compileIds(documents: HarnessDocument[]) {
  return sortedObject(
    documents
      .map((document) => [idOf(document), document] as const)
      .filter(
        (entry): entry is readonly [string, HarnessDocument] =>
          entry[0] !== null
      )
      .map(([id, document]) => [
        id,
        {
          path: document.relativePath,
          kind: textOf(document.frontmatter?.kind),
          status: textOf(document.frontmatter?.status),
          sha256: document.sha256,
        },
      ])
  )
}

function compileKnowledgeIndex(documents: HarnessDocument[]) {
  const byType = new Map<string, ReturnType<typeof docSummary>[]>()
  const byTag = new Map<string, ReturnType<typeof docSummary>[]>()
  const byScopePath = new Map<string, ReturnType<typeof docSummary>[]>()
  const byStatus = new Map<string, ReturnType<typeof docSummary>[]>()
  const byImpact = new Map<string, ReturnType<typeof docSummary>[]>()

  for (const document of documents.filter(
    (candidate) => candidate.frontmatter?.kind === 'knowledge'
  )) {
    const summary = docSummary(document)
    const knowledgeType =
      textOf(document.frontmatter?.knowledge_type) ?? 'unknown'
    const status = textOf(document.frontmatter?.status) ?? 'unknown'
    const impact = textOf(document.frontmatter?.impact) ?? 'unspecified'
    const scope = recordOf(document.frontmatter?.scope)
    const scopePaths = asStringArray(scope.paths)

    groupedPush(byType, knowledgeType, summary)
    groupedPush(byStatus, status, summary)
    groupedPush(byImpact, impact, summary)

    for (const tag of asStringArray(document.frontmatter?.tags))
      groupedPush(byTag, tag, summary)
    for (const scopePath of scopePaths)
      groupedPush(byScopePath, scopePath, summary)
  }

  return {
    byKnowledgeType: sortedObject(byType),
    byTag: sortedObject(byTag),
    byScopePath: sortedObject(byScopePath),
    byStatus: sortedObject(byStatus),
    byImpact: sortedObject(byImpact),
  }
}

function compileWorkflowIndex(documents: HarnessDocument[]) {
  return documents
    .filter((document) => document.frontmatter?.kind === 'workflow')
    .map((document) => ({
      ...docSummary(document),
      callable: booleanOf(document.frontmatter?.callable) ?? false,
      phases: asStringArray(document.frontmatter?.phases),
      conditionalPhases: asStringArray(
        document.frontmatter?.conditional_phases
      ),
    }))
}

function compileRoleBundles(documents: HarnessDocument[]) {
  const byId = new Map(
    documents
      .map((document) => [idOf(document), document] as const)
      .filter(
        (entry): entry is readonly [string, HarnessDocument] =>
          entry[0] !== null
      )
  )
  const knowledge = documents.filter(
    (document) => document.frontmatter?.kind === 'knowledge'
  )

  return documents
    .filter((document) => document.frontmatter?.kind === 'role')
    .map((role) => {
      const selectors = recordOf(role.frontmatter?.selectors)
      const selectorTags = new Set(asStringArray(selectors.tags))
      const selectorTypes = new Set(asStringArray(selectors.knowledge_types))
      const matched = knowledge
        .filter((document) => {
          const tags = asStringArray(document.frontmatter?.tags)
          const type = textOf(document.frontmatter?.knowledge_type)
          return (
            tags.some((tag) => selectorTags.has(tag)) ||
            (type !== undefined && selectorTypes.has(type))
          )
        })
        .map((document) => ({
          ...docSummary(document),
          reasons: ['matched role selector tags or knowledge_types'],
        }))

      const pinned = asStringArray(role.frontmatter?.pinned).map((id) => {
        const document = byId.get(id)
        return {
          id,
          path: document?.relativePath,
          found: document !== undefined,
        }
      })

      return {
        ...docSummary(role),
        selectors,
        pinned,
        matchedDocuments: matched,
        warnings: pinned
          .filter((item) => !item.found)
          .map((item) => `Pinned document was not found: ${item.id}`),
      }
    })
}

/** @deprecated Use {@link scanProject}, {@link buildGraph}, {@link writeGraph} instead. */
export function compileIndexes(options: IndexOptions = {}): IndexResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const generatedRoot = path.join(projectRoot, '.harness/generated')
  const documents = loadHarnessDocuments(projectRoot)
  const doctorReport = runDoctor({ projectRoot })
  const repoMap = compileRepoMap(projectRoot)
  const pathOwnership = compilePathOwnership(projectRoot, repoMap)

  const files: Record<GeneratedFileName, string> = {
    'docs.json': stringify(compileDocs(documents)),
    'ids.json': stringify(compileIds(documents)),
    'knowledge-index.json': stringify(compileKnowledgeIndex(documents)),
    'workflow-index.json': stringify(compileWorkflowIndex(documents)),
    'role-bundles.json': stringify(compileRoleBundles(documents)),
    'diagnostics.json': stringify(doctorReport),
    'repo-map.json': stringify(repoMap),
    'path-ownership.json': stringify(pathOwnership),
  }

  const staleFiles = (Object.entries(files) as [GeneratedFileName, string][])
    .filter(([fileName, content]) => {
      const target = path.join(generatedRoot, fileName)
      return !existsSync(target) || readFileSync(target, 'utf-8') !== content
    })
    .map(([fileName]) => fileName)

  if (options.write) {
    mkdirSync(generatedRoot, { recursive: true })
    for (const [fileName, content] of Object.entries(files)) {
      writeFileSync(path.join(generatedRoot, fileName), content)
    }
    const graph = buildGraph(projectRoot)
    const currentGraph = readGraph(projectRoot)
    if (!currentGraph || isGraphStale(projectRoot, graph)) {
      writeGraph(projectRoot, graph)
    }
  }

  return {
    ok: !options.check || staleFiles.length === 0,
    generatedRoot,
    staleFiles,
    diagnosticSummary: doctorReport.summary,
    files,
  }
}
