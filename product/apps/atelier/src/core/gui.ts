import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { runDoctor } from './doctor'
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

import { createTask, assignTask, taskStatus, closeTask, createRole, editRole, listTasks } from './tasks'
import { listControls, buildCoverageReport, findMissingControls } from './controls'
import { checkPolicy, explainPolicy } from './policy'
import { appendRunHandoff, completeRun, createRun, inspectRun, listRuns, listRunVerification, recordRunVerification, resumeRun } from './runs'



import { reconcile, repairDryRun } from './reconciler'

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

function textOf(value: unknown) {
  return typeof value === 'string' ? value : null
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : undefined
}

function mutationAllowed(options: GuiServerOptions, body: Record<string, unknown>) {
  return options.allowMutations || body.confirm === true
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
  const served = serveStatic(route, projectRoot)
  if (served) return served

  if (route.method === 'GET' && route.pathname === '/api/doctor') {
    return jsonResponse(runDoctor({ projectRoot }))
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
    return jsonResponse({
      projectRoot,
      allowMutations: options.allowMutations,
      graphExists: !!readGraph(projectRoot),
      graph: status,
      stale,
    })
  }

  if (route.method === 'GET' && route.pathname === '/api/tasks') {
    return jsonResponse(listTasks(projectRoot))
  }

  if (route.method === 'GET' && route.pathname === '/api/tasks/status') {
    const queryIndex = route.pathname.indexOf('?')
    const query = queryIndex >= 0 ? route.pathname.slice(queryIndex + 1) : ''
    const params = new URLSearchParams(query)
    const taskId = params.get('id')
    if (!taskId) return errorResponse(400, 'BAD_REQUEST', 'id query parameter is required.')
    return jsonResponse(taskStatus(projectRoot, taskId))
  }

  if (route.method === 'POST' && route.pathname === '/api/tasks/create') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const title = textOf(body.title)
      const description = textOf(body.description)
      if (!title || !description) return errorResponse(400, 'BAD_REQUEST', 'title and description are required.')
      const task = createTask({
        projectRoot,
        title,
        description,
        phase: textOf(body.phase) ?? undefined,
        scope: textOf(body.scope) ?? undefined,
        assignedRoles: stringArray(body.roleIds),
        parentTask: textOf(body.parentTask) ?? null,
      })
      return jsonResponse(task)
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/tasks/assign') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const taskId = textOf(body.taskId)
      if (!taskId) return errorResponse(400, 'BAD_REQUEST', 'taskId is required.')
      return jsonResponse(assignTask({
        projectRoot,
        taskId,
        roleIds: stringArray(body.roleIds),
        agent: textOf(body.agent) ?? undefined,
      }))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/tasks/close') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const taskId = textOf(body.taskId)
      if (!taskId) return errorResponse(400, 'BAD_REQUEST', 'taskId is required.')
      return jsonResponse(closeTask(projectRoot, taskId, textOf(body.outcome) as 'completed' | 'cancelled' | undefined))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'GET' && route.pathname === '/api/runs') {
    const url = new URL(`http://internal${route.pathname}`)
    const statusParam = url.searchParams.get('status')
    const status = statusParam === 'active' || statusParam === 'completed' ? statusParam : undefined
    if (statusParam !== null && status === undefined) {
      return errorResponse(400, 'BAD_REQUEST', "status must be 'active' or 'completed'")
    }
    return jsonResponse(listRuns(projectRoot, { status }))
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/runs/inspect/')) {
    const runId = route.pathname.slice('/api/runs/inspect/'.length)
    if (!runId) return errorResponse(400, 'BAD_REQUEST', 'runId is required.')
    return jsonResponse(inspectRun(projectRoot, runId))
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/runs/resume/')) {
    const runId = route.pathname.slice('/api/runs/resume/'.length)
    if (!runId) return errorResponse(400, 'BAD_REQUEST', 'runId is required.')
    return jsonResponse(resumeRun(projectRoot, runId))
  }

  if (route.method === 'POST' && route.pathname === '/api/runs/create') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      if (!mutationAllowed(options, body)) return errorResponse(403, 'MUTATION_REFUSED', 'confirm=true is required unless mutations are enabled.')
      const taskId = textOf(body.taskId)
      if (!taskId) return errorResponse(400, 'BAD_REQUEST', 'taskId is required.')
      return jsonResponse(createRun({ projectRoot, taskId }))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/runs/handoff') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      if (!mutationAllowed(options, body)) return errorResponse(403, 'MUTATION_REFUSED', 'confirm=true is required unless mutations are enabled.')
      const runId = textOf(body.runId)
      const text = textOf(body.text)
      if (!runId || !text) return errorResponse(400, 'BAD_REQUEST', 'runId and text are required.')
      return jsonResponse(appendRunHandoff(projectRoot, runId, text))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/runs/verify/')) {
    const runId = route.pathname.slice('/api/runs/verify/'.length)
    if (!runId) return errorResponse(400, 'BAD_REQUEST', 'runId is required.')
    return jsonResponse(listRunVerification(projectRoot, runId))
  }

  if (route.method === 'POST' && route.pathname === '/api/runs/verify') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      if (!mutationAllowed(options, body)) return errorResponse(403, 'MUTATION_REFUSED', 'confirm=true is required unless mutations are enabled.')
      const runId = textOf(body.runId)
      const checkId = textOf(body.checkId)
      const status = textOf(body.status)
      const note = textOf(body.note)
      if (!runId || !checkId || !status || !note) return errorResponse(400, 'BAD_REQUEST', 'runId, checkId, status, and note are required.')
      return jsonResponse(recordRunVerification(projectRoot, runId, checkId, status, note))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/runs/complete') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      if (!mutationAllowed(options, body)) return errorResponse(403, 'MUTATION_REFUSED', 'confirm=true is required unless mutations are enabled.')
      const runId = textOf(body.runId)
      if (!runId) return errorResponse(400, 'BAD_REQUEST', 'runId is required.')
      return jsonResponse(completeRun(projectRoot, runId))
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'POST' && route.pathname === '/api/roles/create') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const id = textOf(body.id)
      const title = textOf(body.title)
      if (!id || !title) return errorResponse(400, 'BAD_REQUEST', 'id and title are required.')
      return jsonResponse({ id: createRole({ projectRoot, id, title, pinned: stringArray(body.pinned) }) })
    } catch (error) {
      return errorResponse(400, 'BAD_REQUEST', error instanceof Error ? error.message : String(error))
    }
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/roles/edit/')) {
    const roleId = route.pathname.slice('/api/roles/edit/'.length)
    if (!roleId) return errorResponse(400, 'BAD_REQUEST', 'roleId is required.')
    return jsonResponse(editRole(projectRoot, roleId, {}))
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/policy/check')) {
    const queryIndex = route.pathname.indexOf('?')
    const query = queryIndex >= 0 ? route.pathname.slice(queryIndex + 1) : ''
    const params = new URLSearchParams(query)
    return jsonResponse(checkPolicy({
      projectRoot,
      path: params.get('path') ?? undefined,
      command: params.get('command') ?? undefined,
      tool: params.get('tool') ?? undefined,
    }))
  }

  if (route.method === 'GET' && route.pathname.startsWith('/api/policy/explain')) {
    const queryIndex = route.pathname.indexOf('?')
    const query = queryIndex >= 0 ? route.pathname.slice(queryIndex + 1) : ''
    const params = new URLSearchParams(query)
    return jsonResponse(explainPolicy(projectRoot, params.get('ruleId') ?? undefined))
  }

  if (route.method === 'GET' && route.pathname === '/api/controls/list') {
    return jsonResponse(listControls(projectRoot))
  }

  if (route.method === 'GET' && route.pathname === '/api/controls/coverage') {
    return jsonResponse(buildCoverageReport(projectRoot))
  }

  if (route.method === 'GET' && route.pathname === '/api/controls/missing') {
    return jsonResponse(findMissingControls(projectRoot))
  }

  if (route.method === 'GET' && route.pathname === '/api/reconcile') {
    return jsonResponse(reconcile({ projectRoot }))
  }

  if (route.method === 'GET' && route.pathname === '/api/repair') {
    return jsonResponse(repairDryRun({ projectRoot }))
  }

  return errorResponse(404, 'NOT_FOUND', `No handler for ${route.method} ${route.pathname}.`)
}

export function summarizeProjectRoot(projectRoot: string) {
  const harness = path.join(projectRoot, 'harness')
  return {
    projectRoot,
    harnessExists: existsSync(harness),
  }
}
