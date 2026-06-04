/**
 * Minimal stub — original llm-protocol.ts was deleted in M20 Phase 2.
 * Only the functions still referenced by non-Phase-4 modules are preserved.
 * @deprecated Delete after Phase 3 (context.ts/runs.ts removal).
 */

import { loadHarnessDocuments } from './docs'
import type { Diagnostic, HarnessDocument } from './schema'

export type AtelierRegistryEntry = {
  id: string
  title: string
  path: string
  status: string
  summary: string | null
}

export type AtelierNextAction =
  | { kind: 'read_file'; path: string }
  | { kind: 'shell'; command: string }

const DEFAULT_ROLE_ID = 'role.core.implementer'

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
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

export function inferRoleIds(
  projectRoot: string,
  _inputPath: string,
  explicitRoleIds: readonly string[]
) {
  if (explicitRoleIds.length > 0) return [...explicitRoleIds]

  const documents = loadHarnessDocuments(projectRoot)
  return [firstExistingId(documents, 'role', DEFAULT_ROLE_ID)]
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
  return {
    ...diagnostic,
    details: {
      ...(diagnostic.details ?? {}),
      suggestions,
    },
  }
}

export function renderEntrypointProtocol(documents: readonly HarnessDocument[]) {
  const workflows = documentsForKind(documents, 'workflow').map((doc) => ({
    id: idOf(doc),
    title: titleOf(doc),
  }))
  const roles = documentsForKind(documents, 'role').map((doc) => ({
    id: idOf(doc),
    title: titleOf(doc),
  }))
  return { workflows, roles }
}
