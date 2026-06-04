import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import path from 'node:path'
import { z } from 'zod'
import { buildGraphContextPlan, normalizeContextMode } from './context'
import { runDoctor } from './doctor'

import {
  buildGraph,
  computeGraphStatus,
  isGraphStale,
  readGraph,
  scanProject,
  writeGraph,
} from './graph'


import { checkPolicy, explainPolicy } from './policy'
import { createTask, assignTask, closeTask, taskStatus } from './tasks'
import { appendRunHandoff, completeRun, createRun, inspectRun, listRunVerification, listRuns, recordRunVerification, resumeRun } from './runs'
import { listControls, buildCoverageReport, findMissingControls } from './controls'


import { reconcile, repairDryRun } from './reconciler'

export type McpServerOptions = {
  projectRoot: string
  allowMutations: boolean
}

// The MCP SDK types its inputSchema values as its bundled zod v4 internals
// (`zod/v4/core` `$ZodType`). The runtime is tolerant of any zod schema (it
// normalizes the value through `zod-compat`), so we keep the workspace
// `zod` as our single source of truth and cast at the SDK boundary. The
// cast is safe because the SDK only uses the schema at runtime via its
// compat layer.
type LooseArgs = Record<string, unknown>

function registerTool(
  server: McpServer,
  name: string,
  config: { title?: string; description?: string; inputSchema?: Record<string, z.ZodTypeAny> },
  handler: (args: LooseArgs, extra: unknown) => unknown
) {
  // The cast erases the SDK's internal zod types and our loose-typed args.
  // The schema lives on the config and is validated by the SDK at runtime.
  ;(server.registerTool as unknown as (n: string, c: unknown, h: unknown) => unknown)(
    name,
    config,
    handler
  )
}

function toJsonResult(value: unknown, ok: boolean = true) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
    isError: !ok,
  }
}

function requireMutation(allow: boolean, tool: string, confirm: boolean | undefined) {
  if (allow) return
  if (confirm !== true) {
    throw new Error(
      `Mutation refused: '${tool}' requires confirm=true unless the server was started with --allow-mutations.`
    )
  }
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function textArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function bool(value: unknown): boolean {
  return value === true
}

function boolOptional(value: unknown): boolean | undefined {
  return value === true ? true : value === false ? false : undefined
}

export function buildMcpServer(options: McpServerOptions): McpServer {
  const projectRoot = path.resolve(options.projectRoot)
  const server = new McpServer(
    { name: 'atelier', version: '0.2.0' },
    { capabilities: { tools: {} } }
  )

  registerTool(
    server,
    'atelier_doctor',
    {
      title: 'Atelier Doctor',
      description:
        'Run atelier doctor on the harness and return the JSON report. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult(runDoctor({ projectRoot }))
  )

  registerTool(
    server,
    'atelier_scan',
    {
      title: 'Atelier Scan',
      description:
        'Observe project artifacts and build the Artifact Graph. Read-only by default; pass write=true to persist the snapshot.',
      inputSchema: {
        write: z
          .boolean()
          .default(false)
          .describe('Persist the graph snapshot to harness/atelier/graph.json when true.'),
      },
    },
    async (args) => {
      const result = scanProject(projectRoot)
      if (bool(args.write)) writeGraph(projectRoot, result.graph)
      return toJsonResult(result, result.errors.length === 0)
    }
  )

  registerTool(
    server,
    'atelier_graph',
    {
      title: 'Atelier Graph',
      description:
        'Display the current Artifact Graph snapshot. Reads from cache or builds on demand. Read-only.',
      inputSchema: {},
    },
    async () => {
      const graph = readGraph(projectRoot) ?? buildGraph(projectRoot)
      return toJsonResult(graph)
    }
  )

  registerTool(
    server,
    'atelier_graph_status',
    {
      title: 'Atelier Graph Status',
      description:
        'Summarize graph health, stale artifacts, and orphaned controls. Also reports whether the cached graph is stale. Read-only.',
      inputSchema: {},
    },
    async () => {
      const graph = readGraph(projectRoot) ?? buildGraph(projectRoot)
      const stale = isGraphStale(projectRoot, graph)
      const status = computeGraphStatus(graph)
      return toJsonResult({ graph: status, stale })
    }
  )

  registerTool(
    server,
    'atelier_context_plan',
    {
      title: 'Atelier Context Plan',
      description:
        'Build a role-routed context plan from workflow, role, path, and intent without creating a run. Read-only.',
      inputSchema: {
        workflowId: z.string().describe('Workflow symbolic id (e.g. workflow.isolated-run).'),
        roleIds: z
          .array(z.string())
          .default([])
          .describe('Role ids (primary first). Omit to infer from inputPath.'),
        inputPath: z.string().default('.').describe('Target path inside the repository. Defaults to ".".'),
        intent: z.string().describe('Human-readable description of the run intent.'),
        mode: z
          .enum(['compact', 'full', 'linked'])
          .default('compact')
          .describe('Render mode used for compiled context.'),
        requiredOnly: z
          .boolean()
          .default(false)
          .describe('Skip optional context when true.'),
        taskId: z.string().optional().describe('Task ID to use as context source.'),
      },
    },
    async (args) => {
      const plan = buildGraphContextPlan({
        projectRoot,
        workflowId: text(args.workflowId),
        roleIds: textArray(args.roleIds),
        inputPath: text(args.inputPath) || '.',
        intent: text(args.intent),
        taskId: text(args.taskId) || undefined,
        mode: normalizeContextMode(text(args.mode) || 'compact'),
        requiredOnly: bool(args.requiredOnly),
        selectorV2: true,
      })
      const hasError = plan.diagnostics.some((d) => d.severity === 'error')
      return toJsonResult(plan, !hasError)
    }
  )

  registerTool(
    server,
    'atelier_task_create',
    {
      title: 'Atelier Task Create',
      description: 'Create a new task artifact. Requires confirm=true.',
      inputSchema: {
        title: z.string().describe('Task title.'),
        description: z.string().describe('Task description.'),
        phase: z.string().optional().describe('Phase identifier.'),
        scope: z.string().optional().describe('Scope path.'),
        roleIds: z.array(z.string()).optional().describe('Assigned role IDs.'),
        parentTask: z.string().optional().describe('Parent task ID.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_task_create', boolOptional(args.confirm))
      const task = createTask({
        projectRoot,
        title: text(args.title),
        description: text(args.description),
        phase: text(args.phase) || undefined,
        scope: text(args.scope) || undefined,
        assignedRoles: textArray(args.roleIds),
        parentTask: text(args.parentTask) || null,
      })
      return toJsonResult(task)
    }
  )

  registerTool(
    server,
    'atelier_task_status',
    {
      title: 'Atelier Task Status',
      description: 'Inspect a task artifact. Read-only.',
      inputSchema: {
        taskId: z.string().describe('Task ID to inspect.'),
      },
    },
    async (args) => toJsonResult(taskStatus(projectRoot, text(args.taskId)))
  )

  registerTool(
    server,
    'atelier_task_assign',
    {
      title: 'Atelier Task Assign',
      description: 'Assign roles or agent to a task. Requires confirm=true.',
      inputSchema: {
        taskId: z.string().describe('Task ID to assign.'),
        roleIds: z.array(z.string()).optional().describe('Role IDs to assign.'),
        agent: z.string().optional().describe('Agent name to assign.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_task_assign', boolOptional(args.confirm))
      return toJsonResult(assignTask({ projectRoot, taskId: text(args.taskId), roleIds: textArray(args.roleIds), agent: text(args.agent) || undefined }))
    }
  )

  registerTool(
    server,
    'atelier_task_close',
    {
      title: 'Atelier Task Close',
      description: 'Close a task artifact. Requires confirm=true.',
      inputSchema: {
        taskId: z.string().describe('Task ID to close.'),
        outcome: z.enum(['completed', 'cancelled']).optional().describe('Task close outcome.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_task_close', boolOptional(args.confirm))
      return toJsonResult(closeTask(projectRoot, text(args.taskId), (text(args.outcome) || undefined) as 'completed' | 'cancelled' | undefined))
    }
  )

  registerTool(
    server,
    'atelier_run_create',
    {
      title: 'Atelier Run Create',
      description: 'Materialize a resumable run capsule. Requires confirm=true.',
      inputSchema: {
        taskId: z.string().describe('Task ID for the run capsule.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_run_create', boolOptional(args.confirm))
      return toJsonResult(createRun({ projectRoot, taskId: text(args.taskId) }))
    }
  )

  registerTool(
    server,
    'atelier_run_list',
    {
      title: 'Atelier Run List',
      description: 'List run capsules. Read-only.',
      inputSchema: {
        status: z
          .enum(['active', 'completed'])
          .optional()
          .describe('Optional status filter: active or completed.'),
      },
    },
    async (args) => toJsonResult(listRuns(projectRoot, { status: args.status as 'active' | 'completed' | undefined }))
  )

  registerTool(
    server,
    'atelier_run_inspect',
    {
      title: 'Atelier Run Inspect',
      description: 'Inspect a run capsule. Read-only.',
      inputSchema: {
        runId: z.string().describe('Run ID to inspect.'),
      },
    },
    async (args) => toJsonResult(inspectRun(projectRoot, text(args.runId)))
  )

  registerTool(
    server,
    'atelier_run_resume',
    {
      title: 'Atelier Run Resume',
      description: 'Return resume instructions for a run capsule. Read-only.',
      inputSchema: {
        runId: z.string().describe('Run ID to resume.'),
      },
    },
    async (args) => toJsonResult(resumeRun(projectRoot, text(args.runId)))
  )

  registerTool(
    server,
    'atelier_run_handoff',
    {
      title: 'Atelier Run Handoff',
      description: 'Append handoff text to a run capsule. Requires confirm=true.',
      inputSchema: {
        runId: z.string().describe('Run ID to update.'),
        text: z.string().describe('Handoff text to append.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_run_handoff', boolOptional(args.confirm))
      return toJsonResult(appendRunHandoff(projectRoot, text(args.runId), text(args.text)))
    }
  )

  registerTool(
    server,
    'atelier_run_verify',
    {
      title: 'Atelier Run Verify',
      description: 'List or record verification for a run capsule. Recording requires confirm=true.',
      inputSchema: {
        runId: z.string().describe('Run ID to verify.'),
        checkId: z.string().optional().describe('Check ID to record.'),
        status: z.string().optional().describe('Verification status.'),
        note: z.string().optional().describe('Verification note.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      const checkId = text(args.checkId)
      if (!checkId) return toJsonResult(listRunVerification(projectRoot, text(args.runId)))
      requireMutation(options.allowMutations, 'atelier_run_verify', boolOptional(args.confirm))
      return toJsonResult(recordRunVerification(projectRoot, text(args.runId), checkId, text(args.status), text(args.note)))
    }
  )

  registerTool(
    server,
    'atelier_run_complete',
    {
      title: 'Atelier Run Complete',
      description: 'Complete a run capsule after gates pass. Requires confirm=true.',
      inputSchema: {
        runId: z.string().describe('Run ID to complete.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_run_complete', boolOptional(args.confirm))
      return toJsonResult(completeRun(projectRoot, text(args.runId)))
    }
  )

  registerTool(
    server,
    'atelier_policy_check',
    {
      title: 'Atelier Policy Check',
      description: 'Evaluate governance policy for a path, command, or tool. Read-only.',
      inputSchema: {
        path: z.string().optional().describe('File path to evaluate.'),
        command: z.string().optional().describe('Shell command to evaluate.'),
        tool: z.string().optional().describe('Tool name to evaluate.'),
      },
    },
    async (args) => toJsonResult(checkPolicy({ projectRoot, path: text(args.path), command: text(args.command), tool: text(args.tool) }))
  )

  registerTool(
    server,
    'atelier_policy_explain',
    {
      title: 'Atelier Policy Explain',
      description: 'Explain policy rules and their decisions. Read-only.',
      inputSchema: {
        ruleId: z.string().optional().describe('Specific rule ID to explain.'),
      },
    },
    async (args) => toJsonResult(explainPolicy(projectRoot, text(args.ruleId) || undefined))
  )

  registerTool(
    server,
    'atelier_controls_list',
    {
      title: 'Atelier Controls List',
      description:
        'Observe and list all control mechanisms (checks, linters, hooks, tests, permissions, etc.) from the current project. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult(listControls(projectRoot))
  )

  registerTool(
    server,
    'atelier_controls_coverage',
    {
      title: 'Atelier Controls Coverage',
      description:
        'Report which knowledge items have which control mechanisms. Highlights missing and orphaned controls. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult(buildCoverageReport(projectRoot))
  )

  registerTool(
    server,
    'atelier_controls_missing',
    {
      title: 'Atelier Controls Missing',
      description:
        'List knowledge items that lack one or more control mechanism types. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult(findMissingControls(projectRoot))
  )

  registerTool(
    server,
    'atelier_reconcile',
    {
      title: 'Atelier Reconcile',
      description:
        'Reconcile the Artifact Graph against the current filesystem state, identifying orphan sources, missing controls, policy violations, and curated-edit drifts. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult(reconcile({ projectRoot }))
  )

  registerTool(
    server,
    'atelier_repair',
    {
      title: 'Atelier Repair (Dry Run)',
      description:
        'Preview what reconcile would change without applying any mutations. Read-only (dry-run only for now).',
      inputSchema: {},
    },
    async () => toJsonResult(repairDryRun({ projectRoot }))
  )

  return server
}

export async function runMcpServer(options: McpServerOptions): Promise<void> {
  const server = buildMcpServer(options)
  const transport = new StdioServerTransport()
  await server.connect(transport)
  // Keep the process alive until the transport closes. The CLI relies on
  // runMcpServer not resolving so it does not call process.exit.
  const closed = new Promise<void>((resolve) => {
    transport.onclose = () => resolve()
    process.on('SIGINT', () => resolve())
    process.on('SIGTERM', () => resolve())
  })
  await closed
  await server.close()
}

export const MCP_TOOL_NAMES = [
  'atelier_doctor',
  'atelier_scan',
  'atelier_graph',
  'atelier_graph_status',
  'atelier_context_plan',
  'atelier_task_create',
  'atelier_task_status',
  'atelier_task_assign',
  'atelier_task_close',
  'atelier_run_create',
  'atelier_run_list',
  'atelier_run_inspect',
  'atelier_run_resume',
  'atelier_run_handoff',
  'atelier_run_verify',
  'atelier_run_complete',
  'atelier_reconcile',
  'atelier_repair',
  'atelier_controls_list',
  'atelier_controls_coverage',
  'atelier_controls_missing',
  'atelier_policy_check',
  'atelier_policy_explain',
] as const
