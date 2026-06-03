import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import path from 'node:path'
import { z } from 'zod'
import { buildContextPlan, normalizeContextMode } from './context'
import { runDoctor } from './doctor'
import { generateGeneratedFiles } from './generate'
import {
  buildGraph,
  computeGraphStatus,
  isGraphStale,
  readGraph,
  scanProject,
  writeGraph,
} from './graph'
import { compileIndexes } from './indexer'
import { promoteKnowledgeProposal, proposeKnowledge, rejectKnowledgeProposal } from './knowledge'
import { listAtelierRegistryEntries } from './llm-protocol'
import { repoOwner } from './owner'
import { renameId } from './rename'
import { closeRun, initRun, runStatus } from './runs'

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
    'atelier_index',
    {
      title: 'Atelier Index',
      description:
        'Compile generated harness indexes. When write=false (default) it returns a summary without writing files; pass write=true to refresh the generated artifacts.',
      inputSchema: {
        write: z.boolean().default(false).describe('Write generated files when true.'),
        check: z
          .boolean()
          .default(false)
          .describe('When true, treat the call as a freshness check and do not write.'),
      },
    },
    async (args) => {
      const write = bool(args.write) && !bool(args.check)
      const result = compileIndexes({ projectRoot, write, check: bool(args.check) })
      return toJsonResult(result, result.ok)
    }
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
        semantic: z
          .boolean()
          .default(false)
          .describe('Enable optional semantic recall (TF-style) without affecting required context.'),
        semanticMaxResults: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe('Maximum semantic hits to surface (default 10).'),
      },
    },
    async (args) => {
      const plan = buildContextPlan({
        projectRoot,
        workflowId: text(args.workflowId),
        roleIds: textArray(args.roleIds),
        inputPath: text(args.inputPath) || '.',
        intent: text(args.intent),
        mode: normalizeContextMode(text(args.mode) || 'compact'),
        requiredOnly: bool(args.requiredOnly),
        semantic: bool(args.semantic),
        semanticMaxResults:
          typeof args.semanticMaxResults === 'number' ? args.semanticMaxResults : undefined,
      })
      const hasError = plan.diagnostics.some((d) => d.severity === 'error')
      return toJsonResult(plan, !hasError)
    }
  )

  registerTool(
    server,
    'atelier_workflow_list',
    {
      title: 'Atelier Workflow List',
      description:
        'List workflow ids, titles, summaries, and source paths so agents do not discover them by grepping Markdown. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult({ workflows: listAtelierRegistryEntries(projectRoot, 'workflow') })
  )

  registerTool(
    server,
    'atelier_role_list',
    {
      title: 'Atelier Role List',
      description:
        'List role ids, titles, summaries, and source paths so agents can choose role ids deterministically. Read-only.',
      inputSchema: {},
    },
    async () => toJsonResult({ roles: listAtelierRegistryEntries(projectRoot, 'role') })
  )

  registerTool(
    server,
    'atelier_run_init',
    {
      title: 'Atelier Run Init',
      description:
        'Materialize a context plan into a run folder. Requires confirm=true unless the server was started with --allow-mutations.',
      inputSchema: {
        workflowId: z.string().describe('Workflow symbolic id.'),
        roleIds: z.array(z.string()).default([]).describe('Role ids (primary first). Omit to infer from inputPath.'),
        inputPath: z.string().default('.').describe('Target path inside the repository. Defaults to ".".'),
        intent: z.string().describe('Human-readable description of the run intent.'),
        mode: z.enum(['compact', 'full', 'linked']).default('compact'),
        runId: z.string().optional().describe('Optional explicit run id.'),
        confirm: z
          .boolean()
          .optional()
          .describe('Must be true (or the server must be in allow-mutations mode) to actually write files.'),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_run_init', boolOptional(args.confirm))
      const result = initRun({
        projectRoot,
        workflowId: text(args.workflowId),
        roleIds: textArray(args.roleIds),
        inputPath: text(args.inputPath) || '.',
        intent: text(args.intent),
        mode: normalizeContextMode(text(args.mode) || 'compact'),
        runId: text(args.runId) || undefined,
      })
      return toJsonResult({
        runId: result.runId,
        runPath: result.runPath,
        briefPath: result.briefPath,
        contextPath: result.contextPath,
        manifestPath: result.manifestPath,
        diagnostics: result.plan.diagnostics,
        policy: result.policy,
        nextActions: result.nextActions,
      })
    }
  )

  registerTool(
    server,
    'atelier_run_status',
    {
      title: 'Atelier Run Status',
      description:
        'Inspect an active or completed run: artifacts, missing required artifacts, open knowledge proposals, and run-level diagnostics. Read-only.',
      inputSchema: {
        runId: z.string().describe('Run id (e.g. RUN-...-...-<hash>).'),
      },
    },
    async (args) => toJsonResult(runStatus({ projectRoot, runId: text(args.runId) }))
  )

  registerTool(
    server,
    'atelier_run_close',
    {
      title: 'Atelier Run Close',
      description:
        'Close a run. Enforces the completion gate (required artifacts, knowledge proposal state, scoped doctor errors). Requires confirm=true.',
      inputSchema: {
        runId: z.string().describe('Run id to close.'),
        confirm: z
          .boolean()
          .optional()
          .describe('Must be true (or the server must be in allow-mutations mode) to actually close the run.'),
      },
    },
    async (args) => {
      requireMutation(options.allowMutations, 'atelier_run_close', boolOptional(args.confirm))
      const result = closeRun({ projectRoot, runId: text(args.runId) })
      return toJsonResult(result, result.ok)
    }
  )

  registerTool(
    server,
    'atelier_knowledge_propose',
    {
      title: 'Atelier Knowledge Propose',
      description:
        'Create a knowledge proposal from run evidence. Proposals are reviewable; nothing is promoted automatically. Requires confirm=true.',
      inputSchema: {
        fromRun: z.string().describe('Source run id (RUN-...).'),
        kind: z.string().describe('Knowledge type (rule, adr, lesson, ...).'),
        title: z.string().describe('Short title for the proposal.'),
        tags: z.array(z.string()).default([]),
        evidence: z.string().optional(),
        whyRecur: z.string().optional(),
        whyNotCovered: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(
        options.allowMutations,
        'atelier_knowledge_propose',
        boolOptional(args.confirm)
      )
      const result = proposeKnowledge({
        projectRoot,
        fromRun: text(args.fromRun),
        knowledgeType: text(args.kind),
        title: text(args.title),
        tags: textArray(args.tags),
        evidence: text(args.evidence) || undefined,
        whyRecur: text(args.whyRecur) || undefined,
        whyNotCovered: text(args.whyNotCovered) || undefined,
      })
      return toJsonResult(result)
    }
  )

  registerTool(
    server,
    'atelier_knowledge_promote',
    {
      title: 'Atelier Knowledge Promote',
      description:
        'Promote a knowledge proposal into durable knowledge. Performs duplicate detection, role-bundle impact preview, and index refresh. Requires confirm=true.',
      inputSchema: {
        proposalPath: z.string().describe('Path to the proposal Markdown.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(
        options.allowMutations,
        'atelier_knowledge_promote',
        boolOptional(args.confirm)
      )
      const result = promoteKnowledgeProposal({
        projectRoot,
        proposalPath: text(args.proposalPath),
      })
      return toJsonResult(result, result.ok)
    }
  )

  registerTool(
    server,
    'atelier_knowledge_reject',
    {
      title: 'Atelier Knowledge Reject',
      description:
        'Archive a knowledge proposal without promoting it. Requires confirm=true.',
      inputSchema: {
        proposalPath: z.string().describe('Path to the proposal Markdown.'),
        reason: z.string().optional(),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      requireMutation(
        options.allowMutations,
        'atelier_knowledge_reject',
        boolOptional(args.confirm)
      )
      const result = rejectKnowledgeProposal({
        projectRoot,
        proposalPath: text(args.proposalPath),
        reason: text(args.reason) || undefined,
      })
      return toJsonResult(result)
    }
  )

  registerTool(
    server,
    'atelier_id_rename',
    {
      title: 'Atelier ID Rename',
      description:
        'Preview or apply a symbolic ID rename across the harness. Defaults to preview-only; pass confirm=true (or start the server with --allow-mutations) to write.',
      inputSchema: {
        oldId: z.string().describe('Existing symbolic id.'),
        newId: z.string().describe('Replacement symbolic id.'),
        write: z.boolean().default(false).describe('Apply the rename when true.'),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      const willWrite = bool(args.write)
      if (willWrite) {
        requireMutation(options.allowMutations, 'atelier_id_rename', boolOptional(args.confirm))
      }
      const result = renameId({
        projectRoot,
        oldId: text(args.oldId),
        newId: text(args.newId),
        write: willWrite,
      })
      return toJsonResult(result, result.ok)
    }
  )

  registerTool(
    server,
    'atelier_repo_owner',
    {
      title: 'Atelier Repo Owner',
      description:
        'Resolve a repository path to its Nx project and owning role. Read-only.',
      inputSchema: {
        path: z.string().describe('Repository-relative path to look up.'),
      },
    },
    async (args) => toJsonResult(repoOwner(text(args.path), projectRoot))
  )

  registerTool(
    server,
    'atelier_generate',
    {
      title: 'Atelier Generate',
      description:
        'Refresh generated skills and root adapters. Defaults to preview; pass write=true to actually update files. Pass confirm=true if writing.',
      inputSchema: {
        write: z.boolean().default(false),
        confirm: z.boolean().optional(),
      },
    },
    async (args) => {
      if (bool(args.write)) {
        requireMutation(options.allowMutations, 'atelier_generate', boolOptional(args.confirm))
      }
      const result = generateGeneratedFiles({
        projectRoot,
        write: bool(args.write),
      })
      return toJsonResult(result, result.ok)
    }
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
  'atelier_index',
  'atelier_scan',
  'atelier_graph',
  'atelier_graph_status',
  'atelier_context_plan',
  'atelier_workflow_list',
  'atelier_role_list',
  'atelier_run_init',
  'atelier_run_status',
  'atelier_run_close',
  'atelier_knowledge_propose',
  'atelier_knowledge_promote',
  'atelier_knowledge_reject',
  'atelier_id_rename',
  'atelier_repo_owner',
  'atelier_generate',
] as const
