import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { buildContextPlan, normalizeContextMode } from './context'
import { runDoctor } from './doctor'
import { generateGeneratedFiles } from './generate'
import {
  buildGraph,
  computeGraphStatus,
  graphBlame,
  graphImpact,
  isGraphStale,
  readGraph,
  scanProject,
  writeGraph,
} from './graph'
import { compileIndexes } from './indexer'
import { listKnowledgeProposals, promoteKnowledgeProposal, proposeKnowledge, rejectKnowledgeProposal } from './knowledge'
import { repoOwner } from './owner'
import { compilePathOwnership, compileRepoMap } from './repo-map'
import { renameId } from './rename'
import { reconcile, repairDryRun } from './reconciler'
import { closeRun, initRun, runStatus } from './runs'

export type GuiServerOptions = {
  projectRoot: string
  allowMutations: boolean
  host?: string
}

export type GuiRoute = {
  method: 'GET' | 'POST'
  pathname: string
}

export type GuiResponse = {
  status: number
  contentType: string
  body: string
}

type MutableFlag = {
  allowMutations: boolean
}

function jsonResponse(value: unknown, status = 200): GuiResponse {
  return {
    status,
    contentType: 'application/json; charset=utf-8',
    body: JSON.stringify(value, null, 2),
  }
}

function errorResponse(status: number, code: string, message: string): GuiResponse {
  return jsonResponse({ error: { code, message } }, status)
}

function readJsonBody(raw: string): unknown {
  if (!raw) return {}
  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new Error(
      `Invalid JSON body: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

function ensureMutationAllowed(flag: MutableFlag, tool: string, confirm: unknown) {
  if (flag.allowMutations) return
  if (confirm === true) return
  throw new Error(
    `Mutation refused: '${tool}' requires confirm=true unless the GUI was started with --allow-mutations.`
  )
}

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
}

function isPathInside(parent: string, child: string) {
  const relative = path.relative(parent, child)
  return !relative.startsWith('..') && !path.isAbsolute(relative)
}

function guiRoot() {
  const here = path.dirname(new URL(import.meta.url).pathname)
  return path.resolve(here, '..', 'gui')
}

export function listGuiStaticFiles() {
  const root = guiRoot()
  if (!existsSync(root)) return []
  const indexPath = path.join(root, 'index.html')
  return [
    { relative: 'index.html', absolute: indexPath },
    { relative: 'app.js', absolute: path.join(root, 'app.js') },
    { relative: 'styles.css', absolute: path.join(root, 'styles.css') },
  ]
}

function serveStatic(route: GuiRoute, _projectRoot: string): GuiResponse | null {
  if (route.method !== 'GET') return null
  if (route.pathname === '/' || route.pathname === '/index.html') {
    const { absolute } = listGuiStaticFiles()[0] ?? {}
    if (!absolute || !existsSync(absolute)) {
      return errorResponse(404, 'GUI_NOT_FOUND', 'GUI assets were not found in the build.')
    }
    return {
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: readFileSync(absolute, 'utf-8'),
    }
  }

  const fileMap: Record<string, string> = {
    '/app.js': 'app.js',
    '/styles.css': 'styles.css',
  }
  const fileName = fileMap[route.pathname]
  if (!fileName) return null
  const target = path.join(guiRoot(), fileName)
  if (!isPathInside(guiRoot(), target) || !existsSync(target)) {
    return errorResponse(404, 'GUI_NOT_FOUND', `GUI asset not found: ${route.pathname}`)
  }
  const contentType = fileName.endsWith('.js')
    ? 'application/javascript; charset=utf-8'
    : 'text/css; charset=utf-8'
  return {
    status: 200,
    contentType,
    body: readFileSync(target, 'utf-8'),
  }
}

export function handleGuiRequest(
  route: GuiRoute,
  rawBody: string,
  options: GuiServerOptions
): GuiResponse {
  const projectRoot = path.resolve(options.projectRoot)
  const flag: MutableFlag = { allowMutations: options.allowMutations }
  const served = serveStatic(route, projectRoot)
  if (served) return served

  if (route.method === 'GET' && route.pathname === '/api/doctor') {
    return jsonResponse(runDoctor({ projectRoot }))
  }

  if (route.method === 'GET' && route.pathname === '/api/index') {
    const result = compileIndexes({ projectRoot, write: false })
    return jsonResponse({
      ok: result.ok,
      generatedRoot: result.generatedRoot,
      staleFiles: result.staleFiles,
      diagnosticSummary: result.diagnosticSummary,
      files: result.files,
    })
  }

  if (route.method === 'GET' && route.pathname === '/api/scan') {
    const result = scanProject(projectRoot)
    return jsonResponse(result)
  }

  if (route.method === 'POST' && route.pathname === '/api/scan') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const write = body.write === true
      const result = scanProject(projectRoot)
      if (write) writeGraph(projectRoot, result.graph)
      return jsonResponse({ ...result, written: write })
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'GET' && route.pathname === '/api/graph') {
    const graph = readGraph(projectRoot) ?? buildGraph(projectRoot)
    return jsonResponse(graph)
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/graph/impact')) {
    const queryIndex = route.pathname.indexOf('?')
    const query = queryIndex >= 0 ? route.pathname.slice(queryIndex + 1) : ''
    const params = new URLSearchParams(query)
    const target = params.get('path')
    if (!target) return errorResponse(400, 'BAD_REQUEST', 'path query parameter is required.')
    const graph = readGraph(projectRoot) ?? buildGraph(projectRoot)
    return jsonResponse(graphImpact(graph, target))
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/graph/blame/')) {
    const artifactId = route.pathname.slice('/api/graph/blame/'.length)
    if (!artifactId) return errorResponse(400, 'BAD_REQUEST', 'artifactId is required.')
    const graph = readGraph(projectRoot) ?? buildGraph(projectRoot)
    return jsonResponse(graphBlame(graph, artifactId))
  }

  if (route.method === 'GET' && route.pathname === '/api/status') {
    const graph = readGraph(projectRoot) ?? buildGraph(projectRoot)
    const stale = isGraphStale(projectRoot, graph)
    const status = computeGraphStatus(graph)
    return jsonResponse({ graph: status, stale })
  }

  if (route.method === 'GET' && route.pathname === '/api/role-bundles') {
    const result = compileIndexes({ projectRoot, write: false })
    const generatedPath = path.join(result.generatedRoot, 'role-bundles.json')
    if (!existsSync(generatedPath)) {
      return jsonResponse({ ok: false, bundles: {} })
    }
    return jsonResponse(JSON.parse(readFileSync(generatedPath, 'utf-8')))
  }

  if (route.method === 'GET' && route.pathname === '/api/knowledge') {
    return jsonResponse({ proposals: listKnowledgeProposals(projectRoot) })
  }

  if (route.method === 'GET' && route.pathname === '/api/runs') {
    const activeRoot = path.join(projectRoot, 'harness/runs/active')
    if (!existsSync(activeRoot)) return jsonResponse({ runs: [] })
    const entries = readDirectory(activeRoot)
    return jsonResponse({ runs: entries })
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/runs/') && route.pathname.endsWith('/status')) {
    const runId = route.pathname.slice('/api/runs/'.length, -'/status'.length)
    if (!runId) return errorResponse(400, 'BAD_REQUEST', 'runId is required.')
    return jsonResponse(runStatus({ projectRoot, runId }))
  }

  if (route.method === 'POST' && route.pathname === '/api/context/plan') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const workflowId = textOf(body.workflowId)
      const roleIds = Array.isArray(body.roleIds) ? body.roleIds.filter((id): id is string => typeof id === 'string') : null
      const inputPath = textOf(body.inputPath)
      const intent = textOf(body.intent)
      if (!workflowId || !roleIds || roleIds.length === 0 || !inputPath || !intent) {
        return errorResponse(400, 'BAD_REQUEST', 'workflowId, roleIds, inputPath, intent are required.')
      }
      const plan = buildContextPlan({
        projectRoot,
        workflowId,
        roleIds,
        inputPath,
        intent,
        mode: normalizeContextMode(textOf(body.mode) ?? undefined),
        requiredOnly: body.requiredOnly === true,
      })
      return jsonResponse(plan)
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/runs/init') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      ensureMutationAllowed(flag, 'atelier.run.init', body.confirm)
      const workflowId = textOf(body.workflowId)
      const roleIds = Array.isArray(body.roleIds) ? body.roleIds.filter((id): id is string => typeof id === 'string') : null
      const inputPath = textOf(body.inputPath)
      const intent = textOf(body.intent)
      if (!workflowId || !roleIds || roleIds.length === 0 || !inputPath || !intent) {
        return errorResponse(400, 'BAD_REQUEST', 'workflowId, roleIds, inputPath, intent, confirm are required.')
      }
      const result = initRun({
        projectRoot,
        workflowId,
        roleIds,
        inputPath,
        intent,
        mode: normalizeContextMode(textOf(body.mode) ?? undefined),
        runId: textOf(body.runId) ?? undefined,
      })
      return jsonResponse({
        runId: result.runId,
        runPath: result.runPath,
        briefPath: result.briefPath,
        contextPath: result.contextPath,
        manifestPath: result.manifestPath,
      })
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/runs/close') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      ensureMutationAllowed(flag, 'atelier.run.close', body.confirm)
      const runId = textOf(body.runId)
      if (!runId) return errorResponse(400, 'BAD_REQUEST', 'runId and confirm are required.')
      return jsonResponse(closeRun({ projectRoot, runId }))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/knowledge/propose') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      ensureMutationAllowed(flag, 'atelier.knowledge.propose', body.confirm)
      const fromRun = textOf(body.fromRun)
      const knowledgeType = textOf(body.kind)
      const title = textOf(body.title)
      if (!fromRun || !knowledgeType || !title) {
        return errorResponse(400, 'BAD_REQUEST', 'fromRun, kind, title, confirm are required.')
      }
      const result = proposeKnowledge({
        projectRoot,
        fromRun,
        knowledgeType,
        title,
        tags: Array.isArray(body.tags) ? body.tags.filter((t): t is string => typeof t === 'string') : [],
        evidence: textOf(body.evidence) ?? undefined,
        whyRecur: textOf(body.whyRecur) ?? undefined,
        whyNotCovered: textOf(body.whyNotCovered) ?? undefined,
      })
      return jsonResponse(result)
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/knowledge/promote') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      ensureMutationAllowed(flag, 'atelier.knowledge.promote', body.confirm)
      const proposalPath = textOf(body.proposalPath)
      if (!proposalPath) {
        return errorResponse(400, 'BAD_REQUEST', 'proposalPath and confirm are required.')
      }
      return jsonResponse(promoteKnowledgeProposal({ projectRoot, proposalPath }))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/knowledge/reject') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      ensureMutationAllowed(flag, 'atelier.knowledge.reject', body.confirm)
      const proposalPath = textOf(body.proposalPath)
      if (!proposalPath) {
        return errorResponse(400, 'BAD_REQUEST', 'proposalPath and confirm are required.')
      }
      return jsonResponse(
        rejectKnowledgeProposal({
          projectRoot,
          proposalPath,
          reason: textOf(body.reason) ?? undefined,
        })
      )
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/id/rename') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const oldId = textOf(body.oldId)
      const newId = textOf(body.newId)
      const write = body.write === true
      if (!oldId || !newId) {
        return errorResponse(400, 'BAD_REQUEST', 'oldId and newId are required.')
      }
      if (write) {
        ensureMutationAllowed(flag, 'atelier.id.rename', body.confirm)
      }
      return jsonResponse(renameId({ projectRoot, oldId, newId, write }))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/repo-owner')) {
    const queryIndex = route.pathname.indexOf('?')
    const query = queryIndex >= 0 ? route.pathname.slice(queryIndex + 1) : ''
    const params = new URLSearchParams(query)
    const target = params.get('path')
    if (!target) return errorResponse(400, 'BAD_REQUEST', 'path query parameter is required.')
    return jsonResponse(repoOwner(target, projectRoot))
  }

  if (route.method === 'GET' && route.pathname === '/api/repo-map') {
    return jsonResponse(compileRepoMap(projectRoot))
  }

  if (route.method === 'GET' && route.pathname === '/api/path-ownership') {
    const repoMap = compileRepoMap(projectRoot)
    return jsonResponse(compilePathOwnership(projectRoot, repoMap))
  }

  if (route.method === 'GET' && route.pathname === '/api/reconcile') {
    return jsonResponse(reconcile({ projectRoot }))
  }

  if (route.method === 'GET' && route.pathname === '/api/repair') {
    return jsonResponse(repairDryRun({ projectRoot }))
  }

  if (route.method === 'POST' && route.pathname === '/api/generate') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const write = body.write === true
      if (write) {
        ensureMutationAllowed(flag, 'atelier.generate', body.confirm)
      }
      return jsonResponse(generateGeneratedFiles({ projectRoot, write }))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  return errorResponse(404, 'NOT_FOUND', `No handler for ${route.method} ${route.pathname}.`)
}

function readDirectory(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort()
}

export function summarizeProjectRoot(projectRoot: string) {
  const harness = path.join(projectRoot, 'harness')
  const activeRuns = path.join(projectRoot, 'harness/runs/active')
  const completedRuns = path.join(projectRoot, 'harness/runs/completed')
  return {
    projectRoot,
    harnessExists: existsSync(harness),
    activeRunCount: existsSync(activeRuns) ? safeCount(activeRuns) : 0,
    completedRunCount: existsSync(completedRuns) ? safeCount(completedRuns) : 0,
    generatedExists: existsSync(path.join(projectRoot, '.harness/generated')),
  }
}

function safeCount(dir: string) {
  try {
    return readdirSync(dir).filter((name) => !name.startsWith('.')).length
  } catch {
    return 0
  }
}
