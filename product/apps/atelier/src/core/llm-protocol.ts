/**
 * v1 external agent adapter protocol; compatibility only.
 * @deprecated Use Policy Engine, graph registry query, Task/Run command
 * builder, and governed Agent Loop adapter instead.
 */

import path from 'node:path'
import { loadHarnessDocuments } from './docs'
import { repoOwner } from './owner'
import type { Diagnostic, HarnessDocument } from './schema'

/** @deprecated Use graph registry query instead. */
export type AtelierRegistryEntry = {
  id: string
  title: string
  path: string
  status: string
  summary: string | null
}

/** @deprecated Use Policy Engine permissions instead. */
export type AtelierRunPolicy = {
  editAllowed: boolean
  purpose: 'implementation' | 'investigation' | 'review'
}

/** @deprecated Use governed Agent Loop adapter instead. */
export type AtelierNextAction =
  | { kind: 'read_file'; path: string }
  | { kind: 'shell'; command: string }

type EntrypointOptions = {
  documents?: readonly HarnessDocument[]
  workflowId?: string
  roleIds?: readonly string[]
  inputPath?: string
  intent?: string
  mode?: string
}

const DEFAULT_WORKFLOW_ID = 'workflow.isolated-run'
const DEFAULT_ROLE_ID = 'role.core.implementer'

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function shellArg(value: string) {
  if (/^[A-Za-z0-9_./:=@+-]+$/.test(value)) return value
  return JSON.stringify(value)
}

function idOf(document: HarnessDocument) {
  return textOf(document.frontmatter?.id)
}

function titleOf(document: HarnessDocument) {
  return textOf(document.frontmatter?.title) ?? idOf(document) ?? document.relativePath
}

function documentsForKind(
  documents: readonly HarnessDocument[],
  kind: 'workflow' | 'role'
) {
  return documents.filter((document) => document.frontmatter?.kind === kind)
}

function firstExistingId(
  documents: readonly HarnessDocument[],
  kind: 'workflow' | 'role',
  preferred: string
) {
  const entries = documentsForKind(documents, kind)
    .map(idOf)
    .filter((id): id is string => id !== null)
  return entries.includes(preferred) ? preferred : (entries[0] ?? preferred)
}

/** @deprecated Use graph registry query instead. */
export function listAtelierRegistryEntries(
  projectRoot: string,
  kind: 'workflow' | 'role'
): AtelierRegistryEntry[] {
  return documentsForKind(loadHarnessDocuments(projectRoot), kind)
    .map((document) => ({
      id: idOf(document),
      title: titleOf(document),
      path: document.relativePath,
      status: textOf(document.frontmatter?.status) ?? 'unknown',
      summary: textOf(document.frontmatter?.summary),
    }))
    .filter((entry): entry is AtelierRegistryEntry => entry.id !== null)
    .sort((left, right) => left.id.localeCompare(right.id))
}

/** @deprecated Use graph-backed scope/ownership query instead. */
export function inferRoleIds(
  projectRoot: string,
  inputPath: string,
  explicitRoleIds: readonly string[]
) {
  if (explicitRoleIds.length > 0) return [...explicitRoleIds]

  const owner = repoOwner(inputPath, projectRoot)
  if (owner.ownerRole) return [owner.ownerRole]

  const documents = loadHarnessDocuments(projectRoot)
  return [firstExistingId(documents, 'role', DEFAULT_ROLE_ID)]
}

/** @deprecated Use Task/Run command builder instead. */
export function buildRunInitCommand(options: EntrypointOptions = {}) {
  const documents = options.documents ?? []
  const workflowId =
    options.workflowId ??
    (documents.length > 0
      ? firstExistingId(documents, 'workflow', DEFAULT_WORKFLOW_ID)
      : DEFAULT_WORKFLOW_ID)
  const roleIds =
    options.roleIds && options.roleIds.length > 0
      ? [...options.roleIds]
      : [
          documents.length > 0
            ? firstExistingId(documents, 'role', DEFAULT_ROLE_ID)
            : DEFAULT_ROLE_ID,
        ]
  const inputPath = options.inputPath ?? '.'
  const intent = options.intent ?? '<request>'
  const mode = options.mode

  return [
    'atelier run init',
    `--workflow ${shellArg(workflowId)}`,
    ...roleIds.map((roleId) => `--role ${shellArg(roleId)}`),
    `--path ${shellArg(inputPath)}`,
    `--intent ${shellArg(intent)}`,
    mode ? `--mode ${shellArg(mode)}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}

/** @deprecated Use Task/Run command builder instead. */
export function buildContextRenderCommand(options: Required<EntrypointOptions>) {
  return [
    'atelier context render',
    `--workflow ${shellArg(options.workflowId)}`,
    ...options.roleIds.map((roleId) => `--role ${shellArg(roleId)}`),
    `--path ${shellArg(options.inputPath)}`,
    `--intent ${shellArg(options.intent)}`,
    `--mode ${shellArg(options.mode)}`,
  ].join(' ')
}

export function suggestSymbolicIds(
  requestedId: string,
  documents: readonly HarnessDocument[],
  kind: 'workflow' | 'role'
) {
  const suffix = `.${requestedId}`
  const basename = requestedId.split('.').pop() ?? requestedId
  const ids = documentsForKind(documents, kind)
    .map(idOf)
    .filter((id): id is string => id !== null)

  const exactSuffix = ids.filter((id) => id.endsWith(suffix))
  if (exactSuffix.length > 0) return exactSuffix.slice(0, 3)

  const includes = ids.filter(
    (id) => id.includes(requestedId) || id.endsWith(`.${basename}`)
  )
  if (includes.length > 0) return includes.slice(0, 3)

  return ids
    .map((id) => ({
      id,
      score: commonPrefixLength(id, requestedId),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3)
    .map((entry) => entry.id)
}

function commonPrefixLength(left: string, right: string) {
  let index = 0
  while (index < left.length && index < right.length && left[index] === right[index]) {
    index += 1
  }
  return index
}

export function enrichMissingSymbolDiagnostic(
  diagnostic: Diagnostic,
  options: {
    requestedId: string
    documents: readonly HarnessDocument[]
    kind: 'workflow' | 'role'
    workflowId: string
    roleIds: readonly string[]
    inputPath: string
    intent: string
    mode: string
  }
): Diagnostic {
  const suggestions = suggestSymbolicIds(
    options.requestedId,
    options.documents,
    options.kind
  )
  const retryWorkflowId =
    options.kind === 'workflow' ? suggestions[0] ?? options.workflowId : options.workflowId
  const retryRoleIds =
    options.kind === 'role'
      ? options.roleIds.map((roleId) =>
          roleId === options.requestedId ? suggestions[0] ?? roleId : roleId
        )
      : options.roleIds

  return {
    ...diagnostic,
    details: {
      ...(diagnostic.details ?? {}),
      suggestions,
      retryCommand: buildRunInitCommand({
        workflowId: retryWorkflowId,
        roleIds: retryRoleIds,
        inputPath: options.inputPath,
        intent: options.intent,
        mode: options.mode,
      }),
    },
  }
}

export function recoveryLinesForDiagnostic(diagnostic: Diagnostic) {
  const suggestions = Array.isArray(diagnostic.details?.suggestions)
    ? diagnostic.details.suggestions.filter((value): value is string => typeof value === 'string')
    : []
  const retryCommand =
    typeof diagnostic.details?.retryCommand === 'string'
      ? diagnostic.details.retryCommand
      : null
  const lines: string[] = []

  if (suggestions.length > 0) {
    lines.push('', 'Did you mean:', ...suggestions.map((id) => `  ${id}`))
  }

  if (retryCommand) {
    lines.push('', 'Retry:', `  ${retryCommand}`)
  }

  return lines
}

export function diagnosticMessageWithRecovery(diagnostic: Diagnostic) {
  return [
    `${diagnostic.code}: ${diagnostic.message}`,
    ...recoveryLinesForDiagnostic(diagnostic),
  ].join('\n')
}

/** @deprecated Use Policy Engine to evaluate permissions instead of inferring from workflow id text. */
export function runPolicyForWorkflow(workflowId: string): AtelierRunPolicy {
  if (workflowId.includes('review')) {
    return { editAllowed: false, purpose: 'review' }
  }
  if (workflowId.includes('investigation')) {
    return { editAllowed: false, purpose: 'investigation' }
  }
  return { editAllowed: true, purpose: 'implementation' }
}

/** @deprecated Use governed Agent Loop adapter instead. */
export function nextActionsForRunInit(
  projectRoot: string,
  contextPath: string,
  workflowId: string
): AtelierNextAction[] {
  const relativeContextPath = path.relative(projectRoot, contextPath).split(path.sep).join('/')
  const actions: AtelierNextAction[] = [
    { kind: 'read_file', path: relativeContextPath },
  ]

  const policy = runPolicyForWorkflow(workflowId)
  if (policy.purpose === 'review') {
    actions.push(
      { kind: 'shell', command: 'git status --short' },
      { kind: 'shell', command: 'git diff --stat' },
      { kind: 'shell', command: 'git diff --name-only' }
    )
  }

  return actions
}

/** @deprecated Use governed Agent Loop adapter instead. */
export function renderEntrypointProtocol(documents: readonly HarnessDocument[]) {
  return [
    '# Atelier LLM Entry Points',
    '',
    'When starting non-trivial work, run exactly:',
    '',
    '```bash',
    buildRunInitCommand({ documents }),
    '```',
    '',
    'After run init:',
    '',
    '1. Read the generated `context.md`.',
    '2. Follow the workflow, role, and phase instructions inside `context.md`.',
    '3. Record verification evidence and handoff notes for non-trivial work.',
    '4. Run `atelier run close <RUN-ID>` before claiming completion.',
  ].join('\n')
}
