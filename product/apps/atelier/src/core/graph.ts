import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, sha256Text, toPosixPath } from './docs'
import {
  asStringArray,
  type Artifact,
  type ArtifactKind,
  type Edge,
  type GraphSnapshot,
  type GraphStatus,
  type HarnessDocument,
  type OwnershipMode,
} from './schema'

export type { GraphSnapshot, GraphStatus, Artifact, Edge, ArtifactKind } from './schema'

const ATELIER_DIR = 'harness/atelier'

function readJsonFile(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function stableJson(value: unknown): string {
  return JSON.stringify(value, Object.keys(value as object).sort(), 2)
}

function artifactIdForPath(relativePath: string): string {
  return relativePath
    .replace(/\.md$/i, '')
    .replace(/[^a-z0-9/_-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

function contentHashForFile(projectRoot: string, relativePath: string): string {
  const absolute = path.join(projectRoot, relativePath)
  try {
    return sha256Text(readFileSync(absolute, 'utf-8'))
  } catch {
    return sha256Text('')
  }
}

function ownershipModeForPath(relativePath: string): OwnershipMode {
  if (relativePath.startsWith('.harness/generated/')) return 'generated'
  if (relativePath.startsWith('harness/atelier/')) return 'generated'
  if (relativePath.startsWith('harness/runs/')) return 'observed'
  if (relativePath.startsWith('harness/')) return 'curated'
  return 'observed'
}

function listJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) return listJsonFiles(target)
    return entry.isFile() && entry.name.endsWith('.json') ? [target] : []
  })
}

function listRunDirs(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('RUN-'))
    .map((entry) => path.join(dir, entry.name))
}

function docId(document: HarnessDocument): string | null {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function docKind(document: HarnessDocument): ArtifactKind | null {
  const kind = textOf(document.frontmatter?.kind)
  if (kind === 'knowledge' || kind === 'role' || kind === 'workflow' || kind === 'phase' || kind === 'policy') {
    return kind as ArtifactKind
  }
  return 'markdown'
}

function docStatus(document: HarnessDocument): string | null {
  return textOf(document.frontmatter?.status)
}

function artifactStatus(raw: string | null): import('./schema').ArtifactStatus {
  if (raw === 'deprecated' || raw === 'archived') return raw
  return 'active'
}

function isSourceExtension(ext: string): boolean {
  return ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.rs', '.go', '.py', '.rb', '.java', '.kt', '.swift', '.c', '.cc', '.cpp', '.h', '.hpp', '.nix'].includes(ext)
}

function listSourceFiles(root: string, maxFiles = 2000): string[] {
  const out: string[] = []
  const ignore = new Set(['node_modules', '.git', '.harness', 'dist', 'build', '.next', '.cache', '.nx', 'target', '.turbo', 'harness/atelier'])
  const visit = (dir: string) => {
    if (out.length >= maxFiles) return
    let entries: Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
    try {
      const raw = readdirSync(dir, { withFileTypes: true })
      entries = raw as unknown as Array<{ name: string; isDirectory: () => boolean; isFile: () => boolean }>
    } catch {
      return
    }
    for (const entry of entries) {
      if (out.length >= maxFiles) return
      if (entry.name.startsWith('.') && entry.name !== '.opencode' && entry.name !== '.agent') continue
      if (ignore.has(entry.name)) continue
      const absolute = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        visit(absolute)
      } else if (entry.isFile() && isSourceExtension(path.extname(entry.name))) {
        const relative = toPosixPath(path.relative(root, absolute))
        if (!relative.includes('/node_modules/')) out.push(relative)
      }
    }
  }
  visit(root)
  return out.sort()
}

function observeMarkdown(projectRoot: string): { artifacts: Artifact[]; edges: Edge[] } {
  const documents = loadHarnessDocuments(projectRoot)
  const byId = new Map<string, HarnessDocument>()
  const artifacts: Artifact[] = []
  const edges: Edge[] = []

  for (const doc of documents) {
    const id = docId(doc)
    const stableId = id ?? artifactIdForPath(doc.relativePath)
    if (id) byId.set(id, doc)

    artifacts.push({
      id: stableId,
      kind: docKind(doc) ?? 'markdown',
      path: doc.relativePath,
      contentHash: doc.sha256,
      metadata: {
        title: textOf(doc.frontmatter?.title) ?? undefined,
        summary: textOf(doc.frontmatter?.summary) ?? undefined,
        status: docStatus(doc) ?? undefined,
        tags: asStringArray(doc.frontmatter?.tags),
        strictness: doc.strictness,
        headings: doc.headings.length > 0 ? doc.headings : undefined,
      },
      ownership: ownershipModeForPath(doc.relativePath),
      status: artifactStatus(docStatus(doc)),
    })
  }

  return { artifacts, edges }
}

function observeRuns(projectRoot: string): { artifacts: Artifact[]; edges: Edge[] } {
  const activeDir = path.join(projectRoot, 'harness/runs/active')
  const completedDir = path.join(projectRoot, 'harness/runs/completed')
  const artifacts: Artifact[] = []
  const edges: Edge[] = []

  for (const runDir of [...listRunDirs(activeDir), ...listRunDirs(completedDir)]) {
    const runId = path.basename(runDir)
    const manifestPath = path.join(runDir, 'context.manifest.json')
    if (!existsSync(manifestPath)) continue

    const manifest = readJsonFile(manifestPath) as Record<string, unknown> | null
    if (!manifest) continue

    const relativePath = toPosixPath(path.relative(projectRoot, runDir))
    const active = runDir.startsWith(activeDir)

    artifacts.push({
      id: `artifact.run.${runId.toLowerCase()}`,
      kind: 'run',
      path: relativePath,
      contentHash: contentHashForFile(projectRoot, toPosixPath(path.relative(projectRoot, manifestPath))),
      metadata: {
        runId,
        workflowId: textOf(manifest.workflowId) ?? undefined,
        roleIds: asStringArray(manifest.roleIds),
        intent: textOf(manifest.intent) ?? undefined,
        inputPath: textOf(manifest.inputPath) ?? undefined,
        completed: !active,
      },
      ownership: 'observed',
      status: active ? 'active' : 'archived',
    })
  }

  return { artifacts, edges }
}

function observeGeneratedFiles(projectRoot: string): { artifacts: Artifact[]; edges: Edge[] } {
  const generatedDir = path.join(projectRoot, '.harness/generated')
  const artifacts: Artifact[] = []

  for (const filePath of listJsonFiles(generatedDir)) {
    const relativePath = toPosixPath(path.relative(projectRoot, filePath))
    artifacts.push({
      id: `artifact.generated.${artifactIdForPath(relativePath)}`,
      kind: 'generated-file',
      path: relativePath,
      contentHash: contentHashForFile(projectRoot, relativePath),
      metadata: {},
      ownership: 'generated',
      status: 'active',
    })
  }

  return { artifacts, edges: [] }
}

function observeSourceFiles(projectRoot: string): { artifacts: Artifact[]; edges: Edge[] } {
  const artifacts: Artifact[] = []

  for (const relativePath of listSourceFiles(projectRoot)) {
    const ext = path.extname(relativePath)
    const kind: ArtifactKind = ext === '.nix' ? 'generated-file' : 'source-file'
    artifacts.push({
      id: `artifact.source.${artifactIdForPath(relativePath)}`,
      kind,
      path: relativePath,
      contentHash: contentHashForFile(projectRoot, relativePath),
      metadata: { extension: ext },
      ownership: 'observed',
      status: 'active',
    })
  }

  return { artifacts, edges: [] }
}

function extractEdgesFromIndexes(projectRoot: string): Edge[] {
  const edges: Edge[] = []
  const generatedDir = path.join(projectRoot, '.harness/generated')

  const roleBundlesPath = path.join(generatedDir, 'role-bundles.json')
  if (existsSync(roleBundlesPath)) {
    const bundles = readJsonFile(roleBundlesPath)
    if (Array.isArray(bundles)) {
      for (const bundle of bundles) {
        const roleId = textOf((bundle as Record<string, unknown>).id)
        if (!roleId) continue
        const matched = (bundle as Record<string, unknown>).matchedDocuments
        if (Array.isArray(matched)) {
          for (const doc of matched) {
            const docId = textOf((doc as Record<string, unknown>).id)
            if (docId) {
              edges.push({
                from: roleId,
                to: docId,
                kind: 'selects',
                confidence: 'high',
                source: 'role-bundles.json',
              })
            }
          }
        }
      }
    }
  }

  const pathOwnershipPath = path.join(generatedDir, 'path-ownership.json')
  if (existsSync(pathOwnershipPath)) {
    const ownership = readJsonFile(pathOwnershipPath) as Record<string, unknown> | null
    const entries = ownership?.entries
    if (Array.isArray(entries)) {
      for (const entry of entries) {
        const roleId = textOf((entry as Record<string, unknown>).ownerRole)
        const entryPath = textOf((entry as Record<string, unknown>).path)
        if (roleId && entryPath) {
          edges.push({
            from: roleId,
            to: `artifact.source.${artifactIdForPath(entryPath)}`,
            kind: 'scopes',
            confidence: 'medium',
            source: 'path-ownership.json',
          })
        }
      }
    }
  }

  const knowledgeIndexPath = path.join(generatedDir, 'knowledge-index.json')
  if (existsSync(knowledgeIndexPath)) {
    const index = readJsonFile(knowledgeIndexPath) as Record<string, unknown> | null
    if (index) {
      const byType = index.byKnowledgeType as Record<string, Array<{ id?: string }>> | undefined
      if (byType) {
        for (const [type, docs] of Object.entries(byType)) {
          for (const doc of docs) {
            if (doc.id) {
              edges.push({
                from: doc.id,
                to: `knowledge_type:${type}`,
                kind: 'derives_from',
                confidence: 'high',
                source: 'knowledge-index.json',
              })
            }
          }
        }
      }
    }
  }

  return edges
}

function deduplicateArtifacts(artifacts: Artifact[]): Artifact[] {
  const seen = new Map<string, Artifact>()
  for (const artifact of artifacts) {
    const existing = seen.get(artifact.id)
    if (!existing || existing.ownership === 'curated' || (existing.ownership === 'observed' && artifact.ownership === 'curated')) {
      seen.set(artifact.id, artifact)
    }
  }
  return [...seen.values()]
}

function deduplicateEdges(edges: Edge[]): Edge[] {
  const seen = new Set<string>()
  return edges.filter((edge) => {
    const key = `${edge.from}|${edge.to}|${edge.kind}|${edge.source}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function sortArtifacts(artifacts: Artifact[]): Artifact[] {
  return [...artifacts].sort((left, right) => left.id.localeCompare(right.id))
}

function sortEdges(edges: Edge[]): Edge[] {
  return [...edges].sort((left, right) => {
    const from = left.from.localeCompare(right.from)
    if (from !== 0) return from
    const to = left.to.localeCompare(right.to)
    if (to !== 0) return to
    return left.kind.localeCompare(right.kind)
  })
}

export function scanProject(projectRoot: string): ScanResult {
  const resolvedRoot = path.resolve(projectRoot)
  const errors: string[] = []
  const allArtifacts: Artifact[] = []
  const allEdges: Edge[] = []

  try {
    const md = observeMarkdown(resolvedRoot)
    allArtifacts.push(...md.artifacts)
    allEdges.push(...md.edges)
  } catch (error) {
    errors.push(`Markdown observer: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    const runs = observeRuns(resolvedRoot)
    allArtifacts.push(...runs.artifacts)
    allEdges.push(...runs.edges)
  } catch (error) {
    errors.push(`Run observer: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    const generated = observeGeneratedFiles(resolvedRoot)
    allArtifacts.push(...generated.artifacts)
    allEdges.push(...generated.edges)
  } catch (error) {
    errors.push(`Generated-file observer: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    const sources = observeSourceFiles(resolvedRoot)
    allArtifacts.push(...sources.artifacts)
    allEdges.push(...sources.edges)
  } catch (error) {
    errors.push(`Source-file observer: ${error instanceof Error ? error.message : String(error)}`)
  }

  try {
    const indexEdges = extractEdgesFromIndexes(resolvedRoot)
    allEdges.push(...indexEdges)
  } catch (error) {
    errors.push(`Index edge extraction: ${error instanceof Error ? error.message : String(error)}`)
  }

  const graph: GraphSnapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    artifacts: sortArtifacts(deduplicateArtifacts(allArtifacts)),
    edges: sortEdges(deduplicateEdges(allEdges)),
  }

  return { graph, observed: allArtifacts.length, errors }
}

export type ScanResult = {
  graph: GraphSnapshot
  observed: number
  errors: string[]
}

export function buildGraph(projectRoot: string): GraphSnapshot {
  return scanProject(projectRoot).graph
}

export function computeGraphStatus(graph: GraphSnapshot): GraphStatus {
  const kindCounts: Record<string, number> = {}
  const staleArtifacts: Artifact[] = []
  const orphanedArtifacts: Artifact[] = []

  for (const artifact of graph.artifacts) {
    kindCounts[artifact.kind] = (kindCounts[artifact.kind] ?? 0) + 1

    if (artifact.status === 'stale') staleArtifacts.push(artifact)

    const incomingEdges = graph.edges.filter((e) => e.to === artifact.id)
    const outgoingEdges = graph.edges.filter((e) => e.from === artifact.id)
    if (incomingEdges.length === 0 && outgoingEdges.length === 0 && artifact.ownership !== 'observed') {
      orphanedArtifacts.push(artifact)
    }
  }

  return {
    artifactCount: graph.artifacts.length,
    edgeCount: graph.edges.length,
    kindCounts,
    staleArtifacts,
    orphanedArtifacts,
    unresolvedCount: staleArtifacts.length + orphanedArtifacts.length,
  }
}

export function graphImpact(graph: GraphSnapshot, targetPath: string): { artifacts: Artifact[]; edges: Edge[] } {
  const matched = graph.artifacts.filter(
    (a) => a.path === targetPath || a.path.startsWith(targetPath + '/'),
  )
  const matchedIds = new Set(matched.map((a) => a.id))
  const relatedEdges = graph.edges.filter(
    (e) => matchedIds.has(e.from) || matchedIds.has(e.to),
  )
  for (const edge of relatedEdges) {
    if (!matchedIds.has(edge.from)) {
      const from = graph.artifacts.find((a) => a.id === edge.from)
      if (from) matched.push(from)
    }
    if (!matchedIds.has(edge.to)) {
      const to = graph.artifacts.find((a) => a.id === edge.to)
      if (to) matched.push(to)
    }
  }
  return { artifacts: sortArtifacts(deduplicateArtifacts(matched)), edges: sortEdges(relatedEdges) }
}

export function graphBlame(graph: GraphSnapshot, artifactId: string): { artifact: Artifact | undefined; incomingEdges: Edge[]; outgoingEdges: Edge[] } {
  return {
    artifact: graph.artifacts.find((a) => a.id === artifactId),
    incomingEdges: graph.edges.filter((e) => e.to === artifactId).sort((a, b) => a.from.localeCompare(b.from)),
    outgoingEdges: graph.edges.filter((e) => e.from === artifactId).sort((a, b) => a.to.localeCompare(b.to)),
  }
}

export function graphFilePath(projectRoot: string): string {
  return path.join(projectRoot, ATELIER_DIR, 'graph.json')
}

export function writeGraph(projectRoot: string, graph: GraphSnapshot): void {
  const target = graphFilePath(projectRoot)
  mkdirSync(path.dirname(target), { recursive: true })
  writeFileSync(target, stableJson(graph) + '\n')
}

export function readGraph(projectRoot: string): GraphSnapshot | null {
  const target = graphFilePath(projectRoot)
  if (!existsSync(target)) return null
  const data = readJsonFile(target) as GraphSnapshot | null
  if (!data || (data as Record<string, unknown>).version !== 1) return null
  return data
}

export function isGraphStale(projectRoot: string, graph: GraphSnapshot): boolean {
  const current = scanProject(projectRoot).graph
  if (current.artifacts.length !== graph.artifacts.length) return true
  if (current.edges.length !== graph.edges.length) return true

  for (let index = 0; index < current.artifacts.length; index += 1) {
    if (current.artifacts[index]?.contentHash !== graph.artifacts[index]?.contentHash) return true
  }

  return false
}
