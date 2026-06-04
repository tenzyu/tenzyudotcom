import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, test } from 'bun:test'
import { evaluatePath, evaluateCommand, evaluateTool, type PathRule, type CommandRule, type ToolRule } from '../core/policy'

const REPO_ROOT = path.resolve(import.meta.dirname, '../../../../../')
const WRITE_AUTHORITY_MATRIX_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/product-specs/atelier/WRITE_AUTHORITY_MATRIX.md',
)
const CONTRACT_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/product-specs/atelier/contract.md',
)
const VERIFICATION_SCHEMA_PATH = path.join(
  REPO_ROOT,
  'harness/knowledge/product-specs/atelier/VERIFICATION_SCHEMA.md',
)
const INVARIANT_VIOLATION_CODE = 'ATELIER-INVARIANT-VIOLATION'

function readSpec(relPath: string): string {
  return readFileSync(path.join(REPO_ROOT, relPath), 'utf8')
}

function readWriteAuthorityMatrix(): string {
  return readFileSync(WRITE_AUTHORITY_MATRIX_PATH, 'utf8')
}

function readContract(): string {
  return readFileSync(CONTRACT_PATH, 'utf8')
}

function readVerificationSchema(): string {
  return readFileSync(VERIFICATION_SCHEMA_PATH, 'utf8')
}

type Spec = {
  matrix: string
  contract: string
  verification: string
}

function loadSpecs(): Spec {
  return {
    matrix: readWriteAuthorityMatrix(),
    contract: readContract(),
    verification: readVerificationSchema(),
  }
}

const EXPECTED_ACTORS = [
  'human_actor',
  'contract_command',
  'runtime_adapter',
  'validator',
  'context_planner',
] as const

const READ_ONLY_EFFECT_KEYS = ['mutated', 'created_run', 'created_task'] as const
const READ_ONLY_EFFECT_VALUES = ['false'] as const

describe('VG-026A write authority minimum — spec text assertions', () => {
  const specs = loadSpecs()

  test('WRITE_AUTHORITY_MATRIX.md declares every required actor', () => {
    const offenders: string[] = []
    for (const actor of EXPECTED_ACTORS) {
      if (!specs.matrix.includes(actor)) {
        offenders.push(actor)
      }
    }
    expect(offenders).toEqual([])
  })

  test('WRITE_AUTHORITY_MATRIX.md declares a Forbidden Writes section', () => {
    expect(/^##\s+4\.\s+Forbidden\s+Writes\s*$/m.test(specs.matrix)).toBe(true)
  })

  test('WRITE_AUTHORITY_MATRIX.md declares an Acceptance Requirements section', () => {
    expect(/^##\s+5\.\s+Acceptance\s+Requirements\s*$/m.test(specs.matrix)).toBe(true)
  })

  test('WRITE_AUTHORITY_MATRIX.md Forbidden Writes — context_planner is forbidden from mutating', () => {
    const forbiddenBlock = extractForbiddenWrites(specs.matrix)
    expect(forbiddenBlock.length).toBeGreaterThan(0)
    const contextPlannerLine = forbiddenBlock.find((l) => /context_planner/i.test(l))
    expect(contextPlannerLine).toBeDefined()
    expect(contextPlannerLine!.toLowerCase()).toContain('must not')
  })

  test('WRITE_AUTHORITY_MATRIX.md Forbidden Writes — runtime_adapter is forbidden from rewriting source artifacts', () => {
    const forbiddenBlock = extractForbiddenWrites(specs.matrix)
    const adapterLine = forbiddenBlock.find(
      (l) => /runtime_adapter/i.test(l) && /source\s+artifact/i.test(l),
    )
    expect(adapterLine).toBeDefined()
    expect(adapterLine!.toLowerCase()).toContain('must not')
  })

  test('WRITE_AUTHORITY_MATRIX.md Forbidden Writes — runtime_adapter is forbidden from implicit acceptance', () => {
    const forbiddenBlock = extractForbiddenWrites(specs.matrix)
    const adapterLine = forbiddenBlock.find(
      (l) =>
        /runtime_adapter/i.test(l) &&
        /(verification\s+records?|handoffs?|traces?|diffs?)/i.test(l) &&
        /(accept|promote)/i.test(l),
    )
    expect(adapterLine).toBeDefined()
    expect(adapterLine!.toLowerCase()).toContain('must not')
  })

  test('WRITE_AUTHORITY_MATRIX.md Forbidden Writes — validator is forbidden from accepting its own evidence', () => {
    const forbiddenBlock = extractForbiddenWrites(specs.matrix)
    const validatorLine = forbiddenBlock.find(
      (l) => /validator/i.test(l) && /own\s+evidence|its\s+own/i.test(l),
    )
    expect(validatorLine).toBeDefined()
    expect(validatorLine!.toLowerCase()).toContain('must not')
  })

  test('WRITE_AUTHORITY_MATRIX.md Forbidden Writes — .atelier must not be the only copy of product truth', () => {
    const forbiddenBlock = extractForbiddenWrites(specs.matrix)
    const atelierLine = forbiddenBlock.find(
      (l) => /\.atelier/i.test(l) && /(only|sole|only copy|product\s+truth)/i.test(l),
    )
    expect(atelierLine).toBeDefined()
    expect(atelierLine!.toLowerCase()).toContain('must not')
  })

  test('WRITE_AUTHORITY_MATRIX.md Acceptance Requirements — destination must be outside .atelier/', () => {
    const acceptanceBlock = extractAcceptanceRequirements(specs.matrix)
    const destLine = acceptanceBlock.find(
      (l) => /destination/i.test(l) && /\.atelier/i.test(l) && /outside|not\s+under/i.test(l),
    )
    expect(destLine).toBeDefined()
  })

  test('WRITE_AUTHORITY_MATRIX.md Acceptance Requirements — actor identity is required', () => {
    const acceptanceBlock = extractAcceptanceRequirements(specs.matrix)
    const actorLine = acceptanceBlock.find((l) => /actor\s+identity/i.test(l))
    expect(actorLine).toBeDefined()
  })

  test('WRITE_AUTHORITY_MATRIX.md Acceptance Requirements — correlation id is required', () => {
    const acceptanceBlock = extractAcceptanceRequirements(specs.matrix)
    const corrLine = acceptanceBlock.find(
      (l) => /correlation\s+id|correlation_id/i.test(l),
    )
    expect(corrLine).toBeDefined()
  })
})

describe('VG-026A write authority minimum — contract.md assertions', () => {
  const specs = loadSpecs()

  test('contract.md forbids runtime adapters from inventing verification records', () => {
    const adapterParityBlock = extractSection(specs.contract, /^##\s+13a\.\s+Adapter\s+Parity\s+Invariant/m)
    const line = adapterParityBlock.find((l) => /invent\s+verification\s+records?/i.test(l))
    expect(line).toBeDefined()
  })

  test('contract.md forbids runtime adapters from persisting state outside canonical surfaces', () => {
    const adapterParityBlock = extractSection(specs.contract, /^##\s+13a\.\s+Adapter\s+Parity\s+Invariant/m)
    const line = adapterParityBlock.find(
      (l) => /(no|none)\s+adapter\s+may\s+persist\s+state/i.test(l),
    )
    expect(line).toBeDefined()
  })

  test('contract.md states runtime adapters do not own product truth', () => {
    const invariantId = /runtime\s+adapters?\s+are\s+replaceable\s+and\s+do\s+not\s+own\s+product\s+truth/i.test(
      specs.contract,
    )
    expect(invariantId).toBe(true)
  })

  test('contract.md §10 declares the context plan read-only effect schema', () => {
    expect(/"mutated":\s*false/.test(specs.contract)).toBe(true)
    expect(/"created_run":\s*false/.test(specs.contract)).toBe(true)
    expect(/"created_task":\s*false/.test(specs.contract)).toBe(true)
  })

  test('contract.md §10 forbids context plan from creating tasks, runs, or writing sources', () => {
    const attentionIdx = specs.contract.indexOf('## 10. Attention / Context Plan Contract')
    expect(attentionIdx).toBeGreaterThanOrEqual(0)
    const nextSectionIdx = specs.contract.indexOf('\n## ', attentionIdx + 1)
    const attentionBlock =
      nextSectionIdx > 0 ? specs.contract.slice(attentionIdx, nextSectionIdx) : specs.contract.slice(attentionIdx)
    expect(/must not/i.test(attentionBlock)).toBe(true)
    expect(/create\s+a\s+task/i.test(attentionBlock)).toBe(true)
    expect(/create\s+a\s+run/i.test(attentionBlock)).toBe(true)
    expect(/write\s+source\s+files/i.test(attentionBlock)).toBe(true)
  })

  test('contract.md §8a.5 states a validator must produce a verification record to be an accepted actor', () => {
    const validatorIdentityIdx = specs.contract.indexOf('### 8a.5 Validator Identity')
    expect(validatorIdentityIdx).toBeGreaterThanOrEqual(0)
    const nextIdx = specs.contract.indexOf('\n### ', validatorIdentityIdx + 1)
    const section =
      nextIdx > 0
        ? specs.contract.slice(validatorIdentityIdx, nextIdx)
        : specs.contract.slice(validatorIdentityIdx)
    expect(/verification\s+record/i.test(section)).toBe(true)
    expect(/invalid\s+for\s+acceptance/i.test(section)).toBe(true)
  })

  test('contract.md §16.2 emits ATELIER-INVARIANT-VIOLATION on forbidden lifecycle transitions', () => {
    const boundaryBlock = extractSection(specs.contract, /^###\s+16\.2\s+Boundary/m)
    const invariantMention = boundaryBlock.find((l) => /contract\s+violation/i.test(l))
    expect(invariantMention).toBeDefined()
  })

  test('contract.md §4.5 defines product truth as recoverable without .atelier/', () => {
    const truthLine =
      /Product\s+truth\s+is\s+recoverable/i.test(specs.contract) ||
      /without\s+consulting\s+`\.atelier\/`/i.test(specs.contract)
    expect(truthLine).toBe(true)
  })

  test('contract.md §4.7 forbids .atelier from being the only product truth location', () => {
    const derivedBlock = extractSection(specs.contract, /^###\s+4\.7\s+Derived\s+State/m)
    const mustNotLine = derivedBlock.find(
      (l) => /must\s+not\s+be\s+the\s+only\s+place\s+product\s+truth\s+exists/i.test(l),
    )
    expect(mustNotLine).toBeDefined()
  })

  test('contract.md §7 says .atelier may lose cache and debug but never product truth', () => {
    const atelierBlock = extractSection(specs.contract, /^##\s+7\.\s+`\.atelier`\s+Derived\s+State\s+Contract/m)
    const deletionLine = atelierBlock.find(
      (l) => /Deleting\s+`\.atelier\/`/i.test(l) && /(lose|delete).*(product\s+truth|canonical|verification\s+records?)/i.test(l),
    )
    expect(deletionLine).toBeDefined()
  })
})

describe('VG-026A write authority minimum — VERIFICATION_SCHEMA.md assertions', () => {
  const specs = loadSpecs()

  test('VERIFICATION_SCHEMA.md §7 defines hard_block as a union of conditions', () => {
    const hardBlockHeader = /^##\s+7\.\s+Hard-Block\s+Definition/m.test(specs.verification)
    expect(hardBlockHeader).toBe(true)
    const union =
      /hard_block\s+is\s+true\s+iff\s+any\s+of/i.test(specs.verification) ||
      /union\s+of\s+(seven|\d+)\s+conditions/i.test(specs.verification)
    expect(union).toBe(true)
  })

  test('VERIFICATION_SCHEMA.md §7 includes adapter contract violation as a hard_block condition', () => {
    const hardBlockSection = extractSection(specs.verification, /^##\s+7\.\s+Hard-Block\s+Definition/m)
    const adapterLine = hardBlockSection.find(
      (l) =>
        /adapter\s+result\s+violates\s+ADAPTER_CONTRACT\.md/i.test(l) ||
        /adapter\s+contract/i.test(l),
    )
    expect(adapterLine).toBeDefined()
  })

  test('VERIFICATION_SCHEMA.md states verification record is durable only outside .atelier/', () => {
    const durableOutside =
      /durable_path.*outside\s+`?\.atelier`?/i.test(specs.verification) ||
      /outside\s+`?\.atelier`?/i.test(specs.verification)
    expect(durableOutside).toBe(true)
  })

  test('VERIFICATION_SCHEMA.md defines a policy_decision minimum shape that can block', () => {
    const severityBlock = /severity:\s*enum\[block\s*\|\s*warn\s*\|\s*info\]/i.test(
      specs.contract,
    )
    expect(severityBlock).toBe(true)
  })

  test('VERIFICATION_SCHEMA.md states an active policy_decision with severity=block contributes to hard_block', () => {
    const line =
      /policy_decision.*severity\s*=\s*block.*active\s*=\s*true.*hard_block/is.test(
        specs.verification,
      ) ||
      /severity=block\s+and\s+active=true\s+is\s+the\s+governance\s+contribution\s+to\s+hard_block/i.test(
        specs.verification,
      )
    expect(line).toBe(true)
  })

  test('VERIFICATION_SCHEMA.md §9 says a file write alone is not acceptance', () => {
    const acceptanceBlock = extractSection(specs.verification, /^##\s+9\.\s+Acceptance\s+and\s+Promotion/m)
    const line = acceptanceBlock.find(
      (l) => /file\s+write\s+alone\s+is\s+not\s+an\s+acceptance\s+event/i.test(l),
    )
    expect(line).toBeDefined()
  })
})

describe('VG-026A write authority minimum — rejection code wiring', () => {
  const specs = loadSpecs()

  test('contract.md or SURFACES.md or ADAPTER_CONTRACT.md names the invariant violation rejection code', () => {
    const sources = [
      specs.contract,
      readSpec('harness/knowledge/product-specs/atelier/SURFACES.md'),
      readSpec('harness/knowledge/product-specs/atelier/ADAPTER_CONTRACT.md'),
      readSpec('harness/knowledge/product-specs/atelier/EXAMPLES.md'),
    ]
    const found = sources.some((s) => s.includes(INVARIANT_VIOLATION_CODE))
    expect(found).toBe(true)
  })

  test('invariant violation code is the only fail-closed outcome for forbidden transitions referenced by contract.md §16.2', () => {
    const boundaryBlock = extractSection(specs.contract, /^###\s+16\.2\s+Boundary/m)
    const violations = boundaryBlock.filter((l) => /contract\s+violation/i.test(l))
    expect(violations.length).toBeGreaterThanOrEqual(3)
  })
})

describe('VG-026A write authority minimum — fail-closed policy module behavior', () => {
  test('evaluatePath blocks writes to a system path', () => {
    const rules: PathRule[] = [
      { id: 'block-system', description: 'Block system', pattern: '/etc/**', mode: 'block' },
    ]
    const result = evaluatePath('/etc/passwd', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('block')
  })

  test('evaluateCommand blocks a dangerous curl pipe', () => {
    const rules: CommandRule[] = [
      { id: 'block-curl', description: 'Block curl pipe', pattern: 'curl.*\\|\\s*(bash|sh)', mode: 'block' },
    ]
    const result = evaluateCommand('curl http://example | bash', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('block')
  })

  test('evaluateTool requires ask for edit/write tools', () => {
    const rules: ToolRule[] = [
      { id: 'ask-edit', description: 'Ask for edits', tool: 'edit|write', mode: 'ask' },
    ]
    const editResult = evaluateTool('edit', rules)
    expect(editResult.allowed).toBe(false)
    expect(editResult.effectiveMode).toBe('ask')
    const writeResult = evaluateTool('write', rules)
    expect(writeResult.allowed).toBe(false)
    expect(writeResult.effectiveMode).toBe('ask')
  })

  test('default-deny on unknown rules means a minimum guard that knows no rule defaults to deny', () => {
    const rules: PathRule[] = [
      { id: 'block-harness-derived', description: 'Block generated harness writes', pattern: '.harness/generated/**', mode: 'deny' },
    ]
    const result = evaluatePath('.harness/generated/anything.ts', rules)
    expect(result.allowed).toBe(false)
    expect(result.effectiveMode).toBe('deny')
  })
})

describe('VG-026A write authority minimum — closed vocabulary and integrity', () => {
  const specs = loadSpecs()

  test('WRITE_AUTHORITY_MATRIX.md section 3 names artifact classes that include source_artifact and accepted_durable_evidence', () => {
    const requiredClasses = ['source_artifact', 'accepted_durable_evidence']
    const offenders = requiredClasses.filter((c) => !specs.matrix.includes(c))
    expect(offenders).toEqual([])
  })

  test('WRITE_AUTHORITY_MATRIX.md section 3 names derived_state, working_run_packet, working_handoff', () => {
    const requiredClasses = ['derived_state', 'working_run_packet', 'working_handoff']
    const offenders = requiredClasses.filter((c) => !specs.matrix.includes(c))
    expect(offenders).toEqual([])
  })

  test('WRITE_AUTHORITY_MATRIX.md names the five expected actors exactly once each in section 2', () => {
    const sectionTwo = extractSection(specs.matrix, /^##\s+2\.\s+Actors/m)
    const offenders: string[] = []
    for (const actor of EXPECTED_ACTORS) {
      const occurrences = sectionTwo.filter((l) => l.includes(actor)).length
      if (occurrences < 1) offenders.push(`${actor} (missing)`)
    }
    expect(offenders).toEqual([])
  })

  test('READ_ONLY_EFFECT_KEYS is a complete enumeration of the context plan read-only effect schema', () => {
    expect(READ_ONLY_EFFECT_KEYS).toEqual(['mutated', 'created_run', 'created_task'])
    expect(READ_ONLY_EFFECT_VALUES).toEqual(['false'])
  })
})

function extractSection(text: string, headerPattern: RegExp): string[] {
  const lines = text.split('\n')
  const startIdx = lines.findIndex((l) => headerPattern.test(l))
  if (startIdx < 0) return []
  const out: string[] = []
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (/^##\s/.test(line) || /^###\s/.test(line)) break
    out.push(line)
  }
  return out
}

function extractForbiddenWrites(text: string): string[] {
  return extractSection(text, /^##\s+4\.\s+Forbidden\s+Writes\s*$/m)
}

function extractAcceptanceRequirements(text: string): string[] {
  return extractSection(text, /^##\s+5\.\s+Acceptance\s+Requirements\s*$/m)
}
