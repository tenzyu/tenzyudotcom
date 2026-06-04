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
        assignedRoles: Array.isArray(body.roleIds) ? body.roleIds.filter((r): r is string => typeof r === 'string') : undefined,
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
        roleIds: Array.isArray(body.roleIds) ? body.roleIds.filter((r): r is string => typeof r === 'string') : undefined,
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

  if (route.method === 'POST' && route.pathname === '/api/roles/create') {
    try {
      const body = readJsonBody(rawBody) as Record<string, unknown>
      const id = textOf(body.id)
      const title = textOf(body.title)
      if (!id || !title) return errorResponse(400, 'BAD_REQUEST', 'id and title are required.')
      return jsonResponse({ id: createRole({ projectRoot, id, title, pinned: Array.isArray(body.pinned) ? body.pinned.filter((p): p is string => typeof p === 'string') : undefined }) })
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
