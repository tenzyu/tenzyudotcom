import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments } from './docs'
import { classifyMissingControl, classifyOrphanSource } from './events'
import { buildGraph, readGraph, scanProject, writeGraph } from './graph'
import { type ReconciliationFinding, type RiskAction } from './schema'

const ENFORCEMENT_PATTERNS = [
  /eslint/i,
  /biome/i,
  /prettier/i,
  /typecheck/i,
  /test/i,
  /lint/i,
  /check/i,
  /policy/i,
  /hook/i,
]

const DANGEROUS_PERMISSION_PATTERNS = [
  /allow.*all/i,
  /permission.*unrestricted/i,
  /no.*restrict/i,
  /emergency.*override/i,
  /\*:read,\*:write/i,
]

export type ReconcilerOptions = {
  projectRoot?: string
}

export type ReconcilerResult = {
  findings: ReconciliationFinding[]
  riskActionCounts: Record<RiskAction, number>
  eventCount: number
}

export type RepairDryRunResult = {
  findings: ReconciliationFinding[]
  wouldChange: boolean
  changes: string[]
}

function countByRiskAction(findings: ReconciliationFinding[]): Record<RiskAction, number> {
  const counts: Record<string, number> = { silent: 0, 'auto-reconcile': 0, advisory: 0, task: 0, 'human-decision': 0, block: 0 }
  for (const finding of findings) {
    counts[finding.riskAction] = (counts[finding.riskAction] ?? 0) + 1
  }
  return counts as Record<RiskAction, number>
}

function hasActiveEnforcement(docPath: string, projectRoot: string): boolean {
  const content = readHarnessContent(docPath, projectRoot)
  if (!content) return false
  return ENFORCEMENT_PATTERNS.some((pattern) => pattern.test(content))
}

function readHarnessContent(relativePath: string, projectRoot: string): string | null {
  const target = path.join(projectRoot, relativePath)
  if (!existsSync(target)) return null
  try {
    return readFileSync(target, 'utf-8')
  } catch {
    return null
  }
}

function isPolicyFile(relativePath: string): boolean {
  return relativePath.startsWith('harness/policies/')
}

function isDangerousPermission(content: string): boolean {
  return DANGEROUS_PERMISSION_PATTERNS.some((pattern) => pattern.test(content))
}

function enforcementsForPath(relativePath: string, projectRoot: string): number {
  const allDocs = loadHarnessDocuments(projectRoot)
  let count = 0
  for (const doc of allDocs) {
    if (doc.body.includes(relativePath) && ENFORCEMENT_PATTERNS.some((p) => p.test(doc.body))) {
      count += 1
    }
  }
  return count
}

function extractRoles(projectRoot: string): { id: string; path: string; selectors: string[] }[] {
  const docs = loadHarnessDocuments(projectRoot)
  return docs
    .filter((doc) => doc.frontmatter?.kind === 'role')
    .map((doc) => ({
      id: typeof doc.frontmatter?.id === 'string' ? doc.frontmatter.id : '',
      path: doc.relativePath,
      selectors: extractSelectorValues(doc.frontmatter?.selectors),
    }))
    .filter((role) => role.id !== '')
}

function extractSelectorValues(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return []
  const record = raw as Record<string, unknown>
  const out: string[] = []
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') out.push(item)
      }
    }
    if (typeof value === 'string') out.push(value)
  }
  return out
}

function findOwnedPaths(projectRoot: string, roleId: string): string[] {
  const generatedDir = path.join(projectRoot, '.harness/generated')
  const pathOwnershipPath = path.join(generatedDir, 'path-ownership.json')
  if (!existsSync(pathOwnershipPath)) return []
  try {
    const data = JSON.parse(readFileSync(pathOwnershipPath, 'utf-8')) as { entries?: Array<{ path: string; ownerRole: string | null }> }
    if (!data.entries) return []
    return data.entries
      .filter((entry) => entry.ownerRole === roleId)
      .map((entry) => entry.path)
  } catch {
    return []
  }
}

export function reconcile(options: ReconcilerOptions): ReconcilerResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const findings: ReconciliationFinding[] = []

  const currentGraph = readGraph(projectRoot)
  if (!currentGraph) {
    const scanned = scanProject(projectRoot)
    writeGraph(projectRoot, scanned.graph)
  }

  const artifactsByPath = new Map<string, { id: string; kind: string; path: string; contentHash: string; ownership: string }>()
  const refreshedGraph = readGraph(projectRoot) ?? buildGraph(projectRoot)
  for (const artifact of refreshedGraph.artifacts) {
    if (artifact.path) {
      artifactsByPath.set(artifact.path, {
        id: artifact.id,
        kind: artifact.kind,
        path: artifact.path,
        contentHash: artifact.contentHash,
        ownership: artifact.ownership,
      })
    }
  }

  const allDocs = loadHarnessDocuments(projectRoot)
  const existingPaths = new Set(allDocs.map((doc) => doc.relativePath))
  const docById = new Map<string, string>()
  for (const doc of allDocs) {
    const id = typeof doc.frontmatter?.id === 'string' ? doc.frontmatter.id : null
    if (id) docById.set(id, doc.relativePath)
  }

  for (const doc of allDocs) {
    const content = doc.raw
    const isPolicy = isPolicyFile(doc.relativePath)
    const dangerous = isDangerousPermission(content)

    if (isPolicy && dangerous) {
      findings.push({
        kind: 'policy-violation',
        riskAction: 'block',
        artifactId: typeof doc.frontmatter?.id === 'string' ? doc.frontmatter.id : doc.relativePath,
        artifactPath: doc.relativePath,
        message: `Dangerous permission rule detected: ${doc.relativePath}. Requires human decision.`,
        details: { pattern: DANGEROUS_PERMISSION_PATTERNS.find((p) => p.test(content))?.source },
      })
    }
  }

  for (const doc of allDocs) {
    const id = typeof doc.frontmatter?.id === 'string' ? doc.frontmatter.id : null
    if (!id) continue
    const enforcement = hasActiveEnforcement(doc.relativePath, projectRoot)
    if (!enforcement && id.startsWith('knowledge.')) {
      findings.push(classifyMissingControl(id, doc.relativePath))
    }
  }

  for (const [path, artifact] of artifactsByPath) {
    if (artifact.ownership !== 'observed') continue
    if (!existingPaths.has(path)) {
      const enforcementCount = enforcementsForPath(path, projectRoot)
      if (enforcementCount > 0) {
        findings.push(classifyOrphanSource(artifact.id, path, enforcementCount))
      }
    }
  }

  const roles = extractRoles(projectRoot)
  for (const role of roles) {
    const ownedPaths = findOwnedPaths(projectRoot, role.id)
    const missingPaths: string[] = []
    for (const ownedPath of ownedPaths) {
      if (![...existingPaths].some((docPath) => docPath.startsWith(ownedPath))) {
        missingPaths.push(ownedPath)
      }
    }
  }

  return {
    findings,
    riskActionCounts: countByRiskAction(findings),
    eventCount: 0,
  }
}

export function repairDryRun(options: ReconcilerOptions): RepairDryRunResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const result = reconcile({ projectRoot })
  const changes: string[] = []

  for (const finding of result.findings) {
    if (finding.riskAction === 'auto-reconcile') {
      changes.push(`[auto-reconcile] ${finding.message}`)
    } else if (finding.riskAction === 'silent') {
      continue
    } else {
      changes.push(`[${finding.riskAction}] ${finding.message}`)
    }
  }

  const wouldChange = changes.length > 0 || result.findings.some((f) => f.riskAction === 'auto-reconcile')
  return { findings: result.findings, wouldChange, changes }
}
