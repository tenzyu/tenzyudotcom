import path from 'node:path'
import { loadHarnessDocuments, sha256Text } from './docs'
import { readGraph } from './graph'
import type { ControlCoverageEntry, ControlCoverageReport, ControlMechanism, ControlOwnershipMode, ControlProvenance, ControlType } from './schema'

export type { ControlCoverageEntry, ControlCoverageReport, ControlMechanism, ControlOwnershipMode, ControlProvenance, ControlType }

const CONTROL_PATTERNS: Array<{ type: ControlType; provenance: ControlProvenance; pattern: RegExp; nameHint: string }> = [
  { type: 'check', provenance: 'generated-check', pattern: /generated\/checks\/.*\.(ts|js|json)/i, nameHint: 'generated check' },
  { type: 'linter', provenance: 'eslint', pattern: /\.eslintrc/ , nameHint: 'eslint config' },
  { type: 'linter', provenance: 'biome', pattern: /biome\.json/ , nameHint: 'biome config' },
  { type: 'linter', provenance: 'prettier', pattern: /\.prettierrc/ , nameHint: 'prettier config' },
  { type: 'typecheck', provenance: 'nx-target', pattern: /"typecheck".*"([^"]+)"/ , nameHint: 'typecheck target' },
  { type: 'test', provenance: 'test-file', pattern: /__tests__|\.spec\.|\.test\./ , nameHint: 'test file' },
  { type: 'hook', provenance: 'hook-script', pattern: /\.git\/hooks|husky|lint-staged/ , nameHint: 'git hook' },
  { type: 'permission', provenance: 'policy-file', pattern: /harness\/policies\// , nameHint: 'policy file' },
  { type: 'generator', provenance: 'manifest', pattern: /\/generators?\// , nameHint: 'generator' },
  { type: 'codemod', provenance: 'runner-config', pattern: /\/codemods?\// , nameHint: 'codemod' },
  { type: 'template', provenance: 'template-file', pattern: /\/templates\// , nameHint: 'template file' },
  { type: 'runtime-guard', provenance: 'runner-config', pattern: /runtime.*guard|guard.*runtime/i , nameHint: 'runtime guard' },
  { type: 'review-rule', provenance: 'selector', pattern: /review.*rule|approval.*rule/i , nameHint: 'review rule' },
  { type: 'context-selector', provenance: 'selector', pattern: /selectors|read_when|skip_when/ , nameHint: 'context selector' },
  { type: 'ci-gate', provenance: 'ci-file', pattern: /\.github\/workflows|\.gitlab-ci|circleci|jenkins/i , nameHint: 'CI gate' },
  { type: 'ui-constraint', provenance: 'runner-config', pattern: /ui.*constraint|constraint.*ui/i , nameHint: 'UI constraint' },
]

function detectControlsFromPath(relativePath: string): ControlMechanism[] {
  const controls: ControlMechanism[] = []
  for (const spec of CONTROL_PATTERNS) {
    if (spec.pattern.test(relativePath)) {
      controls.push({
        id: `control.${spec.type}.${sha256Text(relativePath).slice(0, 12)}`,
        type: spec.type,
        name: `${spec.nameHint}: ${path.basename(relativePath)}`,
        path: relativePath,
        ownership: 'observed',
        provenance: spec.provenance,
        targets: [],
        targetIntents: [],
        metadata: {},
      })
    }
  }
  return controls
}

function extractIntentsFromKnowledge(body: string): string[] {
  const intents: string[] = []
  const intentPattern = /intent[:\s]+([^\n.]+)/gi
  for (;;) {
    const match = intentPattern.exec(body)
    if (!match) break
    intents.push(match[1].trim())
  }
  const guardPattern = /guards?\s+([^\n.]+)/gi
  for (;;) {
    const match = guardPattern.exec(body)
    if (!match) break
    intents.push(match[1].trim())
  }
  return intents
}

export function observeControls(projectRoot: string): ControlMechanism[] {
  const allDocs = loadHarnessDocuments(projectRoot)
  const allControls: Map<string, ControlMechanism> = new Map()

  for (const doc of allDocs) {
    const detected = detectControlsFromPath(doc.relativePath)
    for (const control of detected) {
      const key = `${control.type}:${control.path}`
      if (!allControls.has(key)) {
        const targets: string[] = []
        const intents = extractIntentsFromKnowledge(doc.body)
        if (doc.frontmatter?.id && typeof doc.frontmatter.id === 'string') {
          targets.push(doc.frontmatter.id)
        }
        allControls.set(key, { ...control, targets, targetIntents: intents })
      }
    }
  }

  const graph = readGraph(projectRoot)
  if (graph) {
    for (const artifact of graph.artifacts) {
      if (artifact.kind === 'check' || artifact.kind === 'linter') {
        const key = `check:${artifact.path}`
        if (!allControls.has(key)) {
          allControls.set(key, {
            id: `control.check.${artifact.id}`,
            type: 'check',
            name: `artifact: ${artifact.id}`,
            path: artifact.path,
            ownership: 'observed',
            provenance: 'generated-check',
            targets: [artifact.id],
            targetIntents: [],
            metadata: {},
          })
        }
      }
    }
  }

  return [...allControls.values()]
}

export function listControls(projectRoot: string): ControlMechanism[] {
  return observeControls(projectRoot)
}

export function buildCoverageReport(projectRoot: string): ControlCoverageReport {
  const controls = observeControls(projectRoot)
  const allDocs = loadHarnessDocuments(projectRoot)
  const knowledgeDocs = allDocs.filter((doc) => doc.frontmatter?.kind === 'knowledge')

  const typeCounts: Record<string, number> = {}
  for (const control of controls) {
    typeCounts[control.type] = (typeCounts[control.type] ?? 0) + 1
  }

  const entries: ControlCoverageEntry[] = []
  let covered = 0
  const allControlTypes: ControlType[] = ['check', 'linter', 'typecheck', 'test', 'hook', 'permission', 'generator', 'codemod', 'template', 'runtime-guard', 'review-rule', 'context-selector', 'ci-gate', 'ui-constraint']

  for (const doc of knowledgeDocs) {
    const id = typeof doc.frontmatter?.id === 'string' ? doc.frontmatter.id : doc.relativePath
    const matchingControls = controls.filter((c) => c.targets.includes(id))
    const presentTypes = new Set(matchingControls.map((c) => c.type))
    const missingTypes = allControlTypes.filter((t) => !presentTypes.has(t))
    const coverageScore = presentTypes.size / allControlTypes.length

    if (coverageScore > 0) covered += 1

    entries.push({
      knowledgeId: id,
      knowledgePath: doc.relativePath,
      controls: matchingControls,
      missingTypes,
      coverageScore,
    })
  }

  const orphanedControls = controls.filter((c) => {
    if (c.targets.length === 0) return true
    return !c.targets.some((t) => knowledgeDocs.some((d) => d.frontmatter?.id === t))
  })

  return {
    totalKnowledge: knowledgeDocs.length,
    coveredKnowledge: covered,
    uncoveredKnowledge: knowledgeDocs.length - covered,
    totalControls: controls.length,
    orphanedControls,
    entries,
    typeCounts,
  }
}

export function findMissingControls(projectRoot: string): Array<{ knowledgeId: string; knowledgePath: string; missingTypes: ControlType[] }> {
  const report = buildCoverageReport(projectRoot)
  return report.entries
    .filter((entry) => entry.missingTypes.length > 0)
    .map((entry) => ({
      knowledgeId: entry.knowledgeId,
      knowledgePath: entry.knowledgePath,
      missingTypes: entry.missingTypes,
    }))
}
