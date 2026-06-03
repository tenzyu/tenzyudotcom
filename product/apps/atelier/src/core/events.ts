import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { sha256Text } from './docs'
import { readGraph } from './graph'
import {
  type AtelierEvent,
  type EventKind,
  type ReconciliationFinding,
  type RiskAction,
} from './schema'

export type { AtelierEvent, EventKind, ReconciliationFinding, RiskAction }

const ATELIER_DIR = 'harness/atelier'

function eventLogPath(projectRoot: string): string {
  return path.join(projectRoot, ATELIER_DIR, 'events.ndjson')
}

export function generateEventId(): string {
  const raw = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return sha256Text(raw).slice(0, 16)
}

export function appendEvent(projectRoot: string, event: AtelierEvent): void {
  const logPath = eventLogPath(projectRoot)
  mkdirSync(path.dirname(logPath), { recursive: true })
  writeFileSync(logPath, `${JSON.stringify(event)}\n`, { flag: 'a' })
}

export function readEvents(projectRoot: string): AtelierEvent[] {
  const logPath = eventLogPath(projectRoot)
  if (!existsSync(logPath)) return []
  const raw = readFileSync(logPath, 'utf-8').trim()
  if (!raw) return []
  return raw.split('\n').map((line) => {
    try {
      return JSON.parse(line) as AtelierEvent
    } catch {
      return null
    }
  }).filter((event): event is AtelierEvent => event !== null)
}

export function createEvent(kind: EventKind, payload: Record<string, unknown>, source: string): AtelierEvent {
  return {
    id: generateEventId(),
    timestamp: new Date().toISOString(),
    kind,
    payload,
    source,
  }
}

export function createFileChangedEvent(relativePath: string, oldHash: string | null, newHash: string, source: string): AtelierEvent {
  return createEvent('file_changed', { path: relativePath, oldHash, newHash }, source)
}

export function createFileMovedEvent(from: string, to: string, contentHash: string, source: string): AtelierEvent {
  return createEvent('file_moved', { from, to, contentHash }, source)
}

export function createFileDeletedEvent(relativePath: string, contentHash: string, source: string): AtelierEvent {
  return createEvent('file_deleted', { path: relativePath, contentHash }, source)
}

export function createRunStartedEvent(runId: string, workflowId: string, source: string): AtelierEvent {
  return createEvent('run_started', { runId, workflowId }, source)
}

export function createRunCompletedEvent(runId: string, ok: boolean, source: string): AtelierEvent {
  return createEvent('run_completed', { runId, ok }, source)
}

export function createReconciliationFindingEvent(finding: ReconciliationFinding, source: string): AtelierEvent {
  return createEvent('reconciliation_finding', { finding } as unknown as Record<string, unknown>, source)
}

export function classifyChange(
  oldGraphHashes: Map<string, string>,
  newGraphHashes: Map<string, string>,
  knownArtifactKinds: Set<string>,
): { moved: string[]; deleted: string[]; changed: string[]; added: string[] } {
  const moved: string[] = []
  const deleted: string[] = []
  const changed: string[] = []
  const added: string[] = []

  for (const [path, hash] of newGraphHashes) {
    if (oldGraphHashes.has(path)) {
      if (oldGraphHashes.get(path) !== hash) {
        changed.push(path)
      }
    } else {
      added.push(path)
    }
  }

  for (const [oldPath, hash] of oldGraphHashes) {
    if (!newGraphHashes.has(oldPath)) {
      const sameContent = [...newGraphHashes.entries()].find(
        ([newCandidatePath, newHash]) => newHash === hash && knownArtifactKinds.has(pathExtractKind(newCandidatePath)),
      )
      if (sameContent) {
        moved.push(oldPath)
      } else {
        deleted.push(oldPath)
      }
    }
  }

  return { moved, deleted, changed, added }
}

function pathExtractKind(path: string): string {
  if (path.startsWith('harness/knowledge/')) return 'knowledge'
  if (path.startsWith('harness/actions/roles/')) return 'role'
  if (path.startsWith('harness/actions/workflows/')) return 'workflow'
  if (path.startsWith('harness/policies/')) return 'policy'
  if (path.startsWith('.harness/generated/')) return 'generated-file'
  return 'unknown'
}

export function classifyDeletionIntent(
  relativePath: string,
  hasActiveEnforcement: boolean,
  isPolicyFile: boolean,
  isDangerousPermission: boolean,
): { riskAction: RiskAction; reason: string } {
  if (isDangerousPermission) {
    return {
      riskAction: 'block',
      reason: `Dangerous permission file deleted: ${relativePath}. Requires human decision.`,
    }
  }

  if (hasActiveEnforcement && !isPolicyFile) {
    return {
      riskAction: 'advisory',
      reason: `Source deleted but enforcement remains: ${relativePath}. An orphan-source finding is created.`,
    }
  }

  if (isPolicyFile) {
    return {
      riskAction: 'advisory',
      reason: `Policy file deleted: ${relativePath}. Review whether this is intentional.`,
    }
  }

  return {
    riskAction: 'silent',
    reason: `Deleted artifact: ${relativePath}. No active enforcement depends on it.`,
  }
}

export function classifyMissingControl(
  knowledgeId: string,
  knowledgePath: string,
): ReconciliationFinding {
  return {
    kind: 'missing-control',
    riskAction: 'task',
    artifactId: knowledgeId,
    artifactPath: knowledgePath,
    message: `Knowledge exists but no enforcement found: ${knowledgeId}`,
  }
}

export function classifyOrphanSource(
  artifactId: string,
  artifactPath: string,
  enforcementCount: number,
): ReconciliationFinding {
  return {
    kind: 'orphan-source',
    riskAction: 'advisory',
    artifactId,
    artifactPath,
    message: `Source deleted but ${enforcementCount} enforcement(s) remain: ${artifactId}`,
  }
}

export function classifyCuratedEdit(
  artifactId: string,
  artifactPath: string,
  isStricter: boolean,
): ReconciliationFinding {
  return {
    kind: 'curated-edit',
    riskAction: isStricter ? 'advisory' : 'silent',
    artifactId,
    artifactPath,
    message: isStricter
      ? `Curated control is stricter than authored knowledge: ${artifactId}. Candidate knowledge update.`
      : `Curated edit detected: ${artifactId}. No action needed.`,
  }
}

export function buildContentHashIndex(projectRoot: string): Map<string, string> {
  const graph = readGraph(projectRoot)
  if (!graph) return new Map()
  return new Map(graph.artifacts.filter((a) => a.path).map((a) => [a.path, a.contentHash]))
}
