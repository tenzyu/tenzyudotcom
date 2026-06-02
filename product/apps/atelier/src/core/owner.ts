import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { loadHarnessDocuments, toPosixPath } from './docs'
import {
  lookupOwnership,
  type PathOwnership,
} from './repo-map'
import { asStringArray as toStringArray, type HarnessDocument } from './schema'

export type RepoOwnerSource = 'nx-project' | 'role-selector' | 'harness-repo-map' | 'unknown'

export type RepoOwnerResult = {
  path: string
  project: string | null
  ownerRole: string | null
  ownerRolePath: string | null
  source: RepoOwnerSource
  notes: string[]
}

export type NxProject = {
  name: string
  root: string
  relativeRoot: string
  sourceRoot: string | null
  tags: string[]
  type: 'app' | 'lib' | 'unknown'
}

type NxProjectJson = {
  name?: unknown
  root?: unknown
  sourceRoot?: unknown
  projectType?: unknown
  tags?: unknown
}

const PROJECT_CONFIG_FILES = ['project.json', 'package.json', 'Cargo.toml', 'flake.nix'] as const

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function asString(value: unknown): string | null {
  return textOf(value)
}

function loadNxProjects(projectRoot: string): NxProject[] {
  const appsRoot = path.join(projectRoot, 'product/apps')
  const packagesRoot = path.join(projectRoot, 'product/packages')
  const projects: NxProject[] = []

  const harvest = (root: string, type: 'app' | 'lib') => {
    if (!existsSync(root)) return
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const projectDir = path.join(root, entry.name)
      const projectJsonPath = path.join(projectDir, 'project.json')
      if (!existsSync(projectJsonPath)) continue
      const data = readJson(projectJsonPath) as NxProjectJson | null
      if (!data) continue
      const projectName = asString(data.name) ?? entry.name
      const sourceRoot = asString(data.sourceRoot)
      const projectRootValue = asString(data.root) ?? `product/${type === 'app' ? 'apps' : 'packages'}/${entry.name}`
      projects.push({
        name: projectName,
        root: path.join(projectRoot, projectRootValue),
        relativeRoot: toPosixPath(projectRootValue),
        sourceRoot: sourceRoot ? toPosixPath(sourceRoot) : null,
        tags: toStringArray(data.tags),
        type: asString(data.projectType) === 'library' ? 'lib' : type,
      })
    }
  }

  harvest(appsRoot, 'app')
  harvest(packagesRoot, 'lib')
  return projects.sort((left, right) => left.relativeRoot.localeCompare(right.relativeRoot))
}

function roleOwners(documents: HarnessDocument[]) {
  return documents
    .filter((document) => document.frontmatter?.kind === 'role')
    .map((document) => {
      const selectors = collectSelectors(document.frontmatter?.selectors)
      return {
        id: asString(document.frontmatter?.id),
        path: document.relativePath,
        selectors,
        pinned: toStringArray(document.frontmatter?.pinned),
      }
    })
    .filter((role): role is { id: string; path: string; selectors: string[]; pinned: string[] } => role.id !== null)
}

function collectSelectors(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object') return []
  const record = raw as Record<string, unknown>
  const out: string[] = []
  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string') out.push(item)
      }
      continue
    }
    if (typeof value === 'string') out.push(value)
  }
  return out
}



function pathMatches(path: string, pattern: string): boolean {
  if (pattern === path) return true
  if (!pattern.includes('*')) return pattern === path
  const regex = new RegExp(
    '^' +
      pattern
        .split('*')
        .map((segment) => segment.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
        .join('.*') +
      '$'
  )
  return regex.test(path)
}

function projectForPath(target: string, projects: NxProject[]): NxProject | null {
  let best: NxProject | null = null
  for (const project of projects) {
    if (target === project.relativeRoot || target === project.relativeRoot.replace(/\/$/, '')) {
      return project
    }
    if (target.startsWith(`${project.relativeRoot}/`)) {
      if (!best || project.relativeRoot.length > best.relativeRoot.length) {
        best = project
      }
    }
    if (project.sourceRoot && target.startsWith(`${project.sourceRoot}/`)) {
      if (!best || project.sourceRoot.length > (best.sourceRoot?.length ?? 0)) {
        best = project
      }
    }
  }
  return best
}

function roleForPath(target: string, roles: ReturnType<typeof roleOwners>) {
  for (const role of roles) {
    if (role.selectors.some((selector) => pathMatches(target, selector) || target.startsWith(selector.replace(/\/?\*\*?$/, '/')))) {
      return role
    }
  }
  return null
}

export function listNxProjects(projectRoot: string): NxProject[] {
  return loadNxProjects(projectRoot)
}

export function repoOwner(targetPath: string, projectRoot: string): RepoOwnerResult {
  const cleanTarget = toPosixPath(targetPath).replace(/^\.\//, '').replace(/\/$/, '')
  const cached = loadPathOwnershipCache(projectRoot)
  if (cached) {
    const hit = lookupOwnership(cached, cleanTarget)
    if (hit) {
      const notes: string[] = []
      if (hit.project) notes.push(`Matched Nx project '${hit.project}' at ${hit.path} (from generated path-ownership.json).`)
      if (hit.ownerRole) notes.push(`Matched role '${hit.ownerRole}' via generated path-ownership.json.`)
      if (!notes.length) notes.push(`Resolved via generated path-ownership.json (source: ${hit.source}).`)
      return {
        path: cleanTarget,
        project: hit.project,
        ownerRole: hit.ownerRole,
        ownerRolePath: hit.ownerRolePath,
        source: hit.source,
        notes,
      }
    }
  }

  const projects = loadNxProjects(projectRoot)
  const project = projectForPath(cleanTarget, projects)
  const roles = roleOwners(loadHarnessDocuments(projectRoot))
  const role = roleForPath(cleanTarget, roles)

  if (!project && !role) {
    return {
      path: cleanTarget,
      project: null,
      ownerRole: null,
      ownerRolePath: null,
      source: 'unknown',
      notes: [
        'No Nx project matched the path.',
        'No role selector matched the path.',
        'Add `selectors.paths` to the relevant role or declare a `project.json` so future queries can resolve it.',
        'Run `bun nx run atelier:index` to refresh .harness/generated/path-ownership.json.',
      ],
    }
  }

  const notes: string[] = []
  if (project) notes.push(`Matched Nx project '${project.name}' at ${project.relativeRoot}.`)
  if (role) notes.push(`Matched role '${role.id}' via selectors: ${role.selectors.join(', ')}.`)

  return {
    path: cleanTarget,
    project: project?.name ?? null,
    ownerRole: role?.id ?? null,
    ownerRolePath: role?.path ?? null,
    source: project ? 'nx-project' : 'role-selector',
    notes,
  }
}

function loadPathOwnershipCache(projectRoot: string): PathOwnership | null {
  const target = path.join(projectRoot, '.harness/generated/path-ownership.json')
  if (!existsSync(target)) return null
  try {
    return JSON.parse(readFileSync(target, 'utf-8')) as PathOwnership
  } catch {
    return null
  }
}

export function repoOwnerForPath(options: { projectRoot: string; targetPath: string }): RepoOwnerResult {
  return repoOwner(options.targetPath, options.projectRoot)
}

export function listProjectConfigFiles(): readonly string[] {
  return PROJECT_CONFIG_FILES
}
