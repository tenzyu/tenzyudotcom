/**
 * v1 Markdown/generated-index symbolic rename; compatibility only.
 * @deprecated Use graph-aware artifact ID rename with Event Log and
 * impact preview instead.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { parseFrontmatter } from './frontmatter'
import { compileIndexes } from './indexer'
import {
  asStringArray,
  type Diagnostic,
  type HarnessDocument,
} from './schema'
import { toPosixPath } from './docs'

/** @deprecated Use graph-aware artifact ID rename instead. */
export type IdRenameOptions = {
  projectRoot?: string
  oldId: string
  newId: string
  write?: boolean
}

/** @deprecated Use graph-aware artifact ID rename instead. */
export type IdRenameChangeKind =
  | 'frontmatter-id'
  | 'frontmatter-array'
  | 'frontmatter-scalar'
  | 'body-backtick'
  | 'json-string'
  | 'manifest'

/** @deprecated Use graph-aware artifact ID rename instead. */
export type IdRenameChange = {
  path: string
  absolutePath: string
  kind: IdRenameChangeKind
  field?: string
  count: number
  samples: string[]
}

/** @deprecated Use graph-aware artifact ID rename instead. */
export type IdRenameResult = {
  ok: boolean
  oldId: string
  newId: string
  oldPath: string | null
  preview: IdRenameChange[]
  changes: IdRenameChange[]
  written: boolean
  diagnostics: Diagnostic[]
  nextCommands: string[]
}

const FRONTMATTER_ARRAY_FIELDS = [
  'pinned',
  'phases',
  'conditional_phases',
  'required_phases',
  'supersedes',
  'roles',
] as const

const FRONTMATTER_SCALAR_FIELDS = [
  'superseded_by',
  'id',
] as const

const ID_PATTERN = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_-]*)+$/i

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
}

function idOf(document: HarnessDocument) {
  const id = document.frontmatter?.id
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function listMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listMarkdownFiles(target))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(target)
    }
  }
  return files
}

function listJsonFiles(dir: string): string[] {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const target = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listJsonFiles(target))
      continue
    }
    if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(target)
    }
  }
  return files
}

function activeRunContextManifests(projectRoot: string) {
  return listJsonFiles(path.join(projectRoot, 'harness/runs/active')).filter(
    (file) => file.endsWith('context.manifest.json')
  )
}

function countOccurrences(haystack: string, needle: RegExp) {
  const matches = haystack.match(needle)
  return matches ? matches.length : 0
}

function pushSample(samples: string[], sample: string, limit = 3) {
  if (samples.length >= limit) return
  if (samples.includes(sample)) return
  samples.push(sample)
}

function scanFrontmatterForId(
  document: HarnessDocument,
  absolutePath: string,
  relativePath: string,
  oldId: string,
  newId: string
): { changes: IdRenameChange[]; updatedFrontmatter: string | null } {
  if (!document.frontmatterRaw) return { changes: [], updatedFrontmatter: null }
  const frontmatter = document.frontmatter
  if (!frontmatter) return { changes: [], updatedFrontmatter: null }

  const changes: IdRenameChange[] = []
  const samples: string[] = []
  let updatedFrontmatter = document.frontmatterRaw

  const currentId = textOf(frontmatter.id)?.trim()
  if (currentId === oldId) {
    const replacement = `id: ${newId}`
    updatedFrontmatter = updatedFrontmatter.replace(/^id:.*$/m, replacement)
    pushSample(samples, `id: ${oldId} -> ${newId}`)
    changes.push({
      path: relativePath,
      absolutePath,
      kind: 'frontmatter-id',
      field: 'id',
      count: 1,
      samples,
    })
  }

  for (const field of FRONTMATTER_ARRAY_FIELDS) {
    const value = frontmatter[field]
    if (!Array.isArray(value)) continue
    const originalValues = asStringArray(value)
    const updatedValues = originalValues.map((entry) =>
      entry === oldId ? newId : entry
    )
    const changed = originalValues.some(
      (entry, index) => entry !== updatedValues[index]
    )
    if (!changed) continue

    const fieldSamples: string[] = []
    for (const entry of originalValues) {
      if (entry === oldId) pushSample(fieldSamples, `- ${oldId} -> ${newId}`)
    }
    const rendered = renderYamlArray(field, updatedValues)
    const re = new RegExp(`^${escapeRegExp(field)}:[\\s\\S]*?(?=^\\S|$)`, 'm')
    updatedFrontmatter = updatedFrontmatter.replace(re, rendered)
    changes.push({
      path: relativePath,
      absolutePath,
      kind: 'frontmatter-array',
      field,
      count: fieldSamples.length,
      samples: fieldSamples,
    })
  }

  for (const field of FRONTMATTER_SCALAR_FIELDS) {
    if (field === 'id') continue
    const value = frontmatter[field]
    if (typeof value !== 'string') continue
    if (value.trim() !== oldId) continue
    const replacement = `${field}: ${newId}`
    updatedFrontmatter = updatedFrontmatter.replace(
      new RegExp(`^${escapeRegExp(field)}:.*$`, 'm'),
      replacement
    )
    changes.push({
      path: relativePath,
      absolutePath,
      kind: 'frontmatter-scalar',
      field,
      count: 1,
      samples: [`${field}: ${oldId} -> ${newId}`],
    })
  }

  if (changes.length === 0) return { changes: [], updatedFrontmatter: null }
  return { changes, updatedFrontmatter }
}

function renderYamlArray(field: string, values: readonly string[]) {
  if (values.length === 0) return `${field}: []`
  return [field, ...values.map((value) => `  - ${value}`)].join('\n')
}

function scanBodyForId(
  document: HarnessDocument,
  absolutePath: string,
  relativePath: string,
  oldId: string
) {
  const re = new RegExp('`' + escapeRegExp(oldId) + '`', 'g')
  const count = countOccurrences(document.raw, re)
  if (count === 0) return null
  const samples: string[] = []
  for (const _match of document.raw.matchAll(re)) {
    pushSample(samples, `\`${oldId}\``)
  }
  return {
    change: {
      path: relativePath,
      absolutePath,
      kind: 'body-backtick' as const,
      count,
      samples,
    },
  }
}

function updateBodyWithId(raw: string, oldId: string, newId: string) {
  const re = new RegExp('`' + escapeRegExp(oldId) + '`', 'g')
  return raw.replace(re, `\`${newId}\``)
}

function updateMarkdownWithId(
  raw: string,
  oldId: string,
  newId: string,
  hasFrontmatter: boolean,
  updatedFrontmatter: string | null
) {
  const re = new RegExp('`' + escapeRegExp(oldId) + '`', 'g')
  if (!hasFrontmatter) return raw.replace(re, `\`${newId}\``)

  const lines = raw.split(/\r?\n/)
  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === '---'
  )
  if (closingIndex === -1) return raw.replace(re, `\`${newId}\``)

  const head = lines.slice(0, closingIndex + 1)
  const tail = lines.slice(closingIndex + 1).join('\n').replace(re, `\`${newId}\``)

  if (updatedFrontmatter === null) {
    return [...head, tail].join('\n')
  }
  return [`---`, updatedFrontmatter, `---`, tail].join('\n')
}

function scanJsonFileForId(
  absolutePath: string,
  relativePath: string,
  oldId: string,
  newId: string
): { change: IdRenameChange | null; updatedJson: string | null } {
  const raw = readFileSync(absolutePath, 'utf-8')
  if (!raw.includes(oldId)) return { change: null, updatedJson: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { change: null, updatedJson: null }
  }

  const matches: string[] = []
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      if (value === oldId) matches.push(value)
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }
    if (value !== null && typeof value === 'object') {
      for (const inner of Object.values(value as Record<string, unknown>))
        walk(inner)
    }
  }
  walk(parsed)
  if (matches.length === 0) return { change: null, updatedJson: null }

  const replace = (value: unknown): unknown => {
    if (typeof value === 'string') return value === oldId ? newId : value
    if (Array.isArray(value)) return value.map(replace)
    if (value !== null && typeof value === 'object') {
      const result: Record<string, unknown> = {}
      for (const [key, inner] of Object.entries(value as Record<string, unknown>))
        result[key] = replace(inner)
      return result
    }
    return value
  }
  const updated = JSON.stringify(replace(parsed), null, 2)
  return {
    change: {
      path: relativePath,
      absolutePath,
      kind: relativePath.endsWith('context.manifest.json')
        ? 'manifest'
        : 'json-string',
      count: matches.length,
      samples: matches.slice(0, 3).map((match) => `${match} -> ${newId}`),
    },
    updatedJson: updated,
  }
}

function collectSourceFiles(projectRoot: string) {
  return {
    harness: listMarkdownFiles(path.join(projectRoot, 'harness'))
      .filter((file) => !file.includes(`${path.sep}harness${path.sep}legacy${path.sep}`))
      .filter((file) => !file.includes(`${path.sep}harness${path.sep}runs${path.sep}completed${path.sep}`))
      .filter((file) => !file.includes(`${path.sep}harness${path.sep}runs${path.sep}active${path.sep}`))
      .sort((left, right) => left.localeCompare(right)),
    activeRuns: listMarkdownFiles(path.join(projectRoot, 'harness/runs/active')).sort((left, right) =>
      left.localeCompare(right)
    ),
    generated: listJsonFiles(path.join(projectRoot, '.harness/generated')).sort((left, right) =>
      left.localeCompare(right)
    ),
    manifests: activeRunContextManifests(projectRoot).sort((left, right) =>
      left.localeCompare(right)
    ),
  }
}

/** @deprecated Use graph-aware artifact ID rename with Event Log and impact preview instead. */
export function renameId(options: IdRenameOptions): IdRenameResult {
  const projectRoot = path.resolve(options.projectRoot ?? process.cwd())
  const oldId = options.oldId.trim()
  const newId = options.newId.trim()
  const write = options.write === true
  const diagnostics: Diagnostic[] = []

  if (!oldId || !newId) {
    diagnostics.push({
      code: 'INVALID_FRONTMATTER',
      severity: 'error',
      message: 'Both oldId and newId are required for rename.',
    })
    return {
      ok: false,
      oldId,
      newId,
      oldPath: null,
      preview: [],
      changes: [],
      written: false,
      diagnostics,
      nextCommands: [],
    }
  }

  if (oldId === newId) {
    diagnostics.push({
      code: 'INVALID_FRONTMATTER',
      severity: 'error',
      message: 'oldId and newId must differ.',
    })
    return {
      ok: false,
      oldId,
      newId,
      oldPath: null,
      preview: [],
      changes: [],
      written: false,
      diagnostics,
      nextCommands: [],
    }
  }

  if (!ID_PATTERN.test(newId)) {
    diagnostics.push({
      code: 'INVALID_FRONTMATTER',
      severity: 'error',
      message: `newId '${newId}' is not a valid symbolic id (expected dotted lowercase identifier).`,
    })
    return {
      ok: false,
      oldId,
      newId,
      oldPath: null,
      preview: [],
      changes: [],
      written: false,
      diagnostics,
      nextCommands: [],
    }
  }

  const sourceFiles = collectSourceFiles(projectRoot)
  const harnessDocuments = sourceFiles.harness
    .map((absolutePath) => {
      const raw = readFileSync(absolutePath, 'utf-8')
      const parsed = parseFrontmatter(raw)
      const relativePath = toPosixPath(path.relative(projectRoot, absolutePath))
      return {
        absolutePath,
        relativePath,
        raw,
        frontmatter: parsed.frontmatter,
        frontmatterRaw: parsed.frontmatterRaw,
        body: parsed.body,
      }
    })
    .filter(
      (document): document is HarnessDocument & { frontmatterRaw: string } =>
        document.frontmatter !== null && document.frontmatterRaw !== null
    )

  const oldIdOwner = harnessDocuments.find((document) => idOf(document) === oldId)
  if (!oldIdOwner) {
    diagnostics.push({
      code: 'UNRESOLVED_ID_REFERENCE',
      severity: 'error',
      message: `No harness document currently has id '${oldId}'.`,
    })
    return {
      ok: false,
      oldId,
      newId,
      oldPath: null,
      preview: [],
      changes: [],
      written: false,
      diagnostics,
      nextCommands: [],
    }
  }

  const newIdOwner = harnessDocuments.find(
    (document) =>
      idOf(document) === newId && document.absolutePath !== oldIdOwner.absolutePath
  )
  if (newIdOwner) {
    diagnostics.push({
      code: 'DUPLICATE_ID',
      severity: 'error',
      path: newIdOwner.relativePath,
      message: `Refusing to rename: newId '${newId}' already exists at ${newIdOwner.relativePath}.`,
    })
    return {
      ok: false,
      oldId,
      newId,
      oldPath: oldIdOwner.relativePath,
      preview: [],
      changes: [],
      written: false,
      diagnostics,
      nextCommands: [],
    }
  }

  const preview: IdRenameChange[] = []
  const plan: Array<{
    absolutePath: string
    relativePath: string
    updatedContent: string | null
  }> = []

  for (const document of harnessDocuments) {
    const scan = scanFrontmatterForId(
      document,
      document.absolutePath,
      document.relativePath,
      oldId,
      newId
    )
    for (const change of scan.changes) preview.push(change)

    const bodyScan = scanBodyForId(
      document,
      document.absolutePath,
      document.relativePath,
      oldId
    )
    if (bodyScan) preview.push(bodyScan.change)

    if (!write) continue
    if (scan.changes.length === 0 && !bodyScan) continue

    const updated = updateMarkdownWithId(
      document.raw,
      oldId,
      newId,
      document.frontmatterRaw !== null,
      scan.updatedFrontmatter
    )
    if (updated === document.raw) continue
    plan.push({
      absolutePath: document.absolutePath,
      relativePath: document.relativePath,
      updatedContent: updated,
    })
  }

  for (const absolutePath of sourceFiles.activeRuns) {
    const raw = readFileSync(absolutePath, 'utf-8')
    const re = new RegExp('`' + escapeRegExp(oldId) + '`', 'g')
    const count = countOccurrences(raw, re)
    if (count === 0) continue
    const samples: string[] = []
    for (const _match of raw.matchAll(re)) pushSample(samples, `\`${oldId}\``)
    const relativePath = toPosixPath(path.relative(projectRoot, absolutePath))
    preview.push({
      path: relativePath,
      absolutePath,
      kind: 'body-backtick',
      count,
      samples,
    })
    if (write) {
      plan.push({
        absolutePath,
        relativePath,
        updatedContent: updateBodyWithId(raw, oldId, newId),
      })
    }
  }

  for (const absolutePath of sourceFiles.generated) {
    const result = scanJsonFileForId(
      absolutePath,
      toPosixPath(path.relative(projectRoot, absolutePath)),
      oldId,
      newId
    )
    if (result.change) preview.push(result.change)
    if (write && result.updatedJson !== null) {
      plan.push({
        absolutePath,
        relativePath: toPosixPath(path.relative(projectRoot, absolutePath)),
        updatedContent: `${result.updatedJson}\n`,
      })
    }
  }

  for (const absolutePath of sourceFiles.manifests) {
    const result = scanJsonFileForId(
      absolutePath,
      toPosixPath(path.relative(projectRoot, absolutePath)),
      oldId,
      newId
    )
    if (result.change) preview.push(result.change)
    if (write && result.updatedJson !== null) {
      plan.push({
        absolutePath,
        relativePath: toPosixPath(path.relative(projectRoot, absolutePath)),
        updatedContent: `${result.updatedJson}\n`,
      })
    }
  }

  if (!write) {
    return {
      ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
      oldId,
      newId,
      oldPath: oldIdOwner.relativePath,
      preview,
      changes: [],
      written: false,
      diagnostics,
      nextCommands: [
        `atelier id rename ${oldId} ${newId} --write`,
        'atelier index',
        'atelier doctor',
      ],
    }
  }

  for (const change of plan) {
    if (change.updatedContent === null) continue
    mkdirSync(path.dirname(change.absolutePath), { recursive: true })
    writeFileSync(change.absolutePath, change.updatedContent)
  }

  compileIndexes({ projectRoot, write: true })

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    oldId,
    newId,
    oldPath: oldIdOwner.relativePath,
    preview,
    changes: preview,
    written: true,
    diagnostics,
    nextCommands: [
      'atelier doctor',
      'atelier index --check',
    ],
  }
}
