import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import { z } from "zod";

type Severity = "P0" | "P1" | "P2";
type BlockerSeverity = Severity | "unknown";
type BlockerStatus = "open" | "partial" | "closed" | "unknown";
type StatusLevel = "error" | "warning" | "info";

const ROOT = path.resolve(import.meta.dir, "..");
const REPO_ROOT = path.resolve(ROOT, "../../../..");
const PRODUCT_SPEC_ROOT = path.join(REPO_ROOT, "harness/knowledge/product-specs/atelier");
const CANONICAL = path.join(ROOT, "canonical");
const STATE = path.join(ROOT, "state");
const VIEWS = path.join(ROOT, "views");
const COMPLETED_DAG_STATUSES = new Set(["implemented", "validated", "accepted"]);
const ACTIVE_PACKET_STATUSES = new Set(["draft", "in_flight", "blocked"]);
const CLOSED_PACKET_STATUSES = new Set(["accepted", "rejected", "superseded"]);
const GENERATED_HEADER = `<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

`;

const rootMarkdownDocs = [
  "AGENT_PACKET_PROTOCOL.md",
  "CONTRACT_TO_BUILD_MATRIX.md",
  "FULL_COMPLETION_DEFINITION.md",
  "IMPLEMENTATION_DAG.md",
  "IMPLEMENTATION_LEDGER.md",
  "IMPLEMENTATION_ORCHESTRATOR.md",
  "REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md",
  "SPEC_IMMUTABILITY_AND_GAP_PROTOCOL.md",
  "SPEC_READ_PLAN.md",
  "SUBAGENT_ROLE_CATALOG.md",
  "VALIDATION_GATE_REGISTRY.md"
];

const viewFiles = [
  "README.md",
  "OPERATING_KERNEL.md",
  "IMPLEMENTATION_DAG.md",
  "IMPLEMENTATION_GRAPH.md",
  "CONTRACT_TO_BUILD_MATRIX.md",
  "VALIDATION_GATE_REGISTRY.md",
  "SPEC_READ_PLAN.md",
  "IMPLEMENTATION_LEDGER.md",
  "SUBAGENT_CONTRACT.md",
  "RESUME_PROTOCOL.md",
  "CLEANUP_PLAN.md"
];

const gateSchema = z.object({
  schema: z.literal("atelier.validation-gate/v1"),
  gate_id: z.string().min(1),
  purpose: z.string().min(1),
  fixture_id: z.string().min(1),
  required_input_files: z.array(z.string()),
  required_expected_output_files: z.array(z.string()),
  positive_cases: z.array(z.string()),
  negative_cases: z.array(z.string()),
  command_source: z.string(),
  command_resolution_algorithm: z.string(),
  command: z.string(),
  required_before: z.string(),
  failure_owner: z.string(),
  retry_policy: z.string(),
  blocking_severity: z.enum(["P0", "P1", "P2"]),
  accepted_statuses: z.array(z.string()),
  proof_artifact: z.string(),
  ledger_update_required: z.boolean(),
  phase_gate_eligible: z.boolean(),
  executable_now: z.boolean()
});

const fixtureSchema = z.object({
  schema: z.literal("atelier.fixture/v1"),
  fixture_id: z.string().min(1),
  command_file: z.string().nullable(),
  input_path: z.string().nullable(),
  expected_path: z.string().nullable(),
  negative_case_id: z.string().nullable(),
  gate_id: z.string().min(1),
  status: z.enum(["executable", "pending_command_implementation", "oracle_gap"]),
  provenance: z.string(),
  last_verified_at: z.string().nullable()
});

const sectionSchema = z.object({
  schema: z.literal("atelier.spec-section/v1"),
  section_id: z.string(),
  source_path: z.string(),
  heading_path: z.array(z.string()),
  heading_slug: z.string(),
  start_line: z.number().int().positive(),
  end_line: z.number().int().positive(),
  sha256: z.string(),
  text_ref: z.object({
    path: z.string(),
    start_line: z.number().int().positive(),
    end_line: z.number().int().positive()
  })
});

const assertionSchema = z.object({
  schema: z.literal("atelier.assertion/v1"),
  assertion_id: z.string(),
  source_section_id: z.string(),
  text: z.string(),
  modality: z.enum(["must", "must_not", "should", "invariant", "definition"]),
  domain: z.enum([
    "graph",
    "verification",
    "event",
    "adapter",
    "surface",
    "hpo",
    "run",
    "write_authority",
    "product",
    "positioning",
    "roadmap",
    "other"
  ]),
  testability: z.enum(["executable", "oracle_gap", "semantic_review", "non_goal"]),
  severity: z.enum(["P0", "P1", "P2"]),
  closed_terms: z.array(z.string()),
  ambiguity_status: z.enum(["clear", "ambiguous", "conflicting"]),
  notes: z.string().optional()
});

const linkSchema = z.object({
  schema: z.literal("atelier.assertion-link/v1"),
  link_id: z.string(),
  assertion_id: z.string().optional(),
  source_section_id: z.string().optional(),
  dag_node_id: z.string(),
  gate_ids: z.array(z.string()),
  fixture_ids: z.array(z.string()),
  provenance: z.string(),
  status: z.enum([
    "linked",
    "blocked",
    "deferred",
    "oracle_gap",
    "non_goal",
    "pending_command_implementation",
    "legacy_unresolved"
  ])
}).passthrough();

const dagNodeSchema = z.object({
  schema: z.literal("atelier.dag-node/v1"),
  dag_node_id: z.string(),
  phase: z.string(),
  title: z.string(),
  depends_on: z.array(z.string()),
  owns_assertion_ids: z.array(z.string()),
  required_gate_ids: z.array(z.string()),
  allowed_file_globs: z.array(z.string()),
  expected_outputs: z.array(z.string()),
  owner_role: z.string()
});

const packetSchema = z.object({
  schema: z.literal("atelier.packet/v1"),
  packet_id: z.string(),
  status: z.enum(["draft", "in_flight", "accepted", "rejected", "blocked", "superseded"]),
  dispatchability_reasons: z.array(z.string()).optional(),
  dag_node_ids: z.array(z.string()).min(1),
  title: z.string(),
  goal: z.string(),
  subagent_contract: z.array(z.string()),
  non_goals: z.array(z.string()),
  required_source_sections: z.array(z.object({
    section_id: z.string(),
    source_path: z.string(),
    heading_path: z.array(z.string()),
    start_line: z.number(),
    end_line: z.number()
  })),
  assertions: z.array(z.object({
    assertion_id: z.string(),
    text: z.string(),
    modality: z.enum(["must", "must_not", "should", "invariant", "definition"]),
    severity: z.enum(["P0", "P1", "P2"]),
    testability: z.enum(["executable", "oracle_gap", "semantic_review", "non_goal"])
  })),
  allowed_files: z.array(z.string()).min(1),
  forbidden_files: z.array(z.string()),
  required_gates: z.array(z.string()),
  required_fixtures: z.array(z.string()),
  required_tests: z.array(z.object({
    name: z.string(),
    test_command: z.string(),
    expected_failure_before_implementation: z.string(),
    expected_pass_after_implementation: z.string(),
    negative_cases: z.array(z.string())
  })),
  validation_profile: z.object({
    profile_id: z.string(),
    global_guards: z.array(z.string()),
    packet_gates: z.array(z.string()),
    test_commands: z.array(z.string()),
    evidence_required: z.array(z.string()),
    skip_global_checks_reason: z.string().optional()
  }),
  acceptance_criteria: z.array(z.string()),
  evidence_expectations: z.array(z.object({
    gate_id: z.string(),
    expected_artifact: z.string()
  })),
  blockers: z.array(z.object({
    blocker_id: z.string(),
    status: z.enum(["open", "partial", "closed", "unknown"]),
    severity: z.enum(["P0", "P1", "P2", "unknown"]).optional(),
    title: z.string().optional(),
    summary: z.string().optional(),
    source_path: z.string(),
    affected_dag_ids: z.array(z.string()).optional(),
    required_resolution: z.string().optional()
  })),
  resume_behavior: z.array(z.string()).optional(),
  failure_policy: z.array(z.string())
});

const roleSchema = z.object({
  schema: z.literal("atelier.role/v1"),
  role_id: z.string(),
  title: z.string(),
  source_ref: z.string(),
  summary: z.string(),
  provenance: z.string()
});

const editBoundarySchema = z.object({
  schema: z.literal("atelier.edit-boundary/v1"),
  boundary_id: z.string(),
  title: z.string(),
  source_ref: z.string(),
  summary: z.string(),
  allowed_file_globs: z.array(z.string()),
  forbidden_file_globs: z.array(z.string()),
  provenance: z.string()
});

async function main() {
  const [command, ...rest] = Bun.argv.slice(2);
  try {
    switch (command) {
      case "doctor":
        await doctor(parseArgs(rest));
        break;
      case "migrate":
        await migrate();
        break;
      case "compile":
        await compileProductSpecs();
        break;
      case "validate":
        await validateControl();
        break;
      case "query":
        await queryContext(parseArgs(rest));
        break;
      case "packet":
        await createPacket(parseArgs(rest));
        break;
      case "render":
        await renderViews();
        break;
      case "llm:jobs":
        await createLlmJobs(parseArgs(rest));
        break;
      case "llm:accept":
        await acceptLlmOutput(parseArgs(rest));
        break;
      case "frontier":
        await frontier(parseArgs(rest));
        break;
      case "resume":
        await resume(parseArgs(rest));
        break;
      case "graph":
        await graph(parseArgs(rest));
        break;
      case "cleanup:plan":
        await cleanupPlan(parseArgs(rest));
        break;
      case "cleanup:apply":
        await cleanupApply(parseArgs(rest));
        break;
      case "validate:packet":
        await validatePacketCommand(parseArgs(rest));
        break;
      case "validate:graph":
        await validateGraphCommand(parseArgs(rest));
        break;
      case "validate:fixtures":
        await validateFixturesCommand(parseArgs(rest));
        break;
      case "validate:tests":
        await validateTestsCommand(parseArgs(rest));
        break;
      case "validate:coverage":
        await validateCoverageCommand(parseArgs(rest));
        break;
      default:
        throw new Error(`Unknown command: ${command ?? "(missing)"}`);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

function parseArgs(args: string[]) {
  const parsed: Record<string, string | boolean> = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--") continue;
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const value = args[i + 1];
      if (value && !value.startsWith("--")) {
        parsed[key] = value;
        i += 1;
      } else {
        parsed[key] = true;
      }
    }
  }
  return parsed;
}

async function doctor(args: Record<string, string | boolean>) {
  const checks = [
    ["current working directory", process.cwd(), true],
    ["implementation-control root", ROOT, existsSync(ROOT)],
    ["product-spec root", PRODUCT_SPEC_ROOT, existsSync(PRODUCT_SPEC_ROOT)],
    ["package.json", path.join(ROOT, "package.json"), existsSync(path.join(ROOT, "package.json"))],
    ["scripts directory", path.join(ROOT, "scripts"), existsSync(path.join(ROOT, "scripts"))],
    ["structured gates", path.join(STATE, "gates/structured-gates-2026-06-04.yaml"), existsSync(path.join(STATE, "gates/structured-gates-2026-06-04.yaml"))],
    ["traceability join table", path.join(STATE, "traceability/dag-02-join-table-2026-06-04.yaml"), existsSync(path.join(STATE, "traceability/dag-02-join-table-2026-06-04.yaml"))],
    ["fixture alias registry", path.join(STATE, "traceability/fixture-alias-registry-2026-06-04.yaml"), existsSync(path.join(STATE, "traceability/fixture-alias-registry-2026-06-04.yaml"))],
    ["packet files", path.join(STATE, "packets"), existsSync(path.join(STATE, "packets"))],
    ["validation files", path.join(STATE, "validations"), existsSync(path.join(STATE, "validations"))]
  ];
  const docs = rootMarkdownDocs.map((doc) => ({
    path: doc,
    exists: existsSync(path.join(ROOT, doc))
  }));
  const result = { schema: "atelier.ic-doctor/v1", root: ROOT, product_spec_root: PRODUCT_SPEC_ROOT, checks: checks.map(([name, target, ok]) => ({ name, target, ok })), legacy_root_docs: docs };
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`Implementation-control root: ${ROOT}`);
  console.log(`Product-spec root: ${PRODUCT_SPEC_ROOT}`);
  for (const check of result.checks) {
    console.log(`${check.ok ? "ok" : "missing"} - ${check.name}: ${check.target}`);
  }
  const missingDocs = docs.filter((doc) => !doc.exists);
  console.log(`legacy root Markdown docs: ${docs.length - missingDocs.length}/${docs.length} present`);
  if (missingDocs.length > 0) {
    console.log(`missing legacy docs: ${missingDocs.map((doc) => doc.path).join(", ")}`);
  }
}

async function migrate() {
  await ensureDirs();
  const manifest: {
    schema: "atelier.legacy-migration-manifest/v1";
    generated_at: string;
    files: Array<Record<string, unknown>>;
    warnings: string[];
  } = { schema: "atelier.legacy-migration-manifest/v1", generated_at: new Date().toISOString(), files: [], warnings: [] };

  for (const doc of rootMarkdownDocs) {
    const source = path.join(ROOT, doc);
    if (!existsSync(source)) {
      manifest.warnings.push(`missing legacy root doc: ${doc}`);
      continue;
    }
    const target = path.join(STATE, "legacy/root-docs", doc);
    await snapshotFile(source, target, "root-doc", manifest.files);
  }

  for (const file of await listFiles(STATE, { skip: ["legacy", "evidence", "handoffs", "llm-inbox", "llm-jobs"] })) {
    if (path.relative(STATE, file) === "ledger.jsonl") continue;
    const rel = path.relative(STATE, file);
    const target = path.join(STATE, "legacy/original-state", rel);
    await snapshotFile(file, target, "state-file", manifest.files);
  }

  await promoteGates(manifest.warnings);
  await promoteFixtures(manifest.warnings);
  await promoteAssertionLinksAndDag(manifest.warnings);
  await promoteRoles(manifest.warnings);
  await promoteEditBoundaries(manifest.warnings);
  await writeOperationalState();
  await normalizePackets(manifest.warnings);
  await promoteEvidence(manifest.files);
  await promoteLedger(manifest.warnings);

  await writeJson(path.join(STATE, "legacy/manifest.json"), manifest);
  console.log(`Migrated legacy implementation-control records (${manifest.files.length} preserved files, ${manifest.warnings.length} warnings).`);
}

async function compileProductSpecs() {
  await mkdir(CANONICAL, { recursive: true });
  const files = (await listFiles(PRODUCT_SPEC_ROOT)).filter((file) => file.endsWith(".md")).sort();
  const sections = [];
  const manifestFiles = [];
  for (const file of files) {
    const rel = slash(path.relative(REPO_ROOT, file));
    const text = await readFile(file, "utf8");
    const lines = splitLines(text);
    const headings = parseHeadings(lines);
    manifestFiles.push({
      path: rel,
      sha256: sha256(text),
      bytes: Buffer.byteLength(text),
      line_count: lines.length,
      heading_count: headings.length
    });
    const ranges = buildSectionRanges(lines, headings);
    for (const range of ranges) {
      const headingPath = range.headingPath.length > 0 ? range.headingPath : [path.basename(file, ".md")];
      const slug = slugify(headingPath.join("-"));
      sections.push({
        schema: "atelier.spec-section/v1",
        section_id: `SPEC-${path.basename(file, ".md").replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}-${shortHash(rel + "::" + headingPath.join(">"))}`,
        source_path: rel,
        heading_path: headingPath,
        heading_slug: slug,
        start_line: range.startLine,
        end_line: range.endLine,
        sha256: sha256(lines.slice(range.startLine - 1, range.endLine).join("\n")),
        text_ref: { path: rel, start_line: range.startLine, end_line: range.endLine }
      });
    }
  }
  await writeJson(path.join(CANONICAL, "product-spec-manifest.json"), {
    schema: "atelier.product-spec-manifest/v1",
    generated_at: new Date().toISOString(),
    product_spec_root: slash(path.relative(REPO_ROOT, PRODUCT_SPEC_ROOT)),
    files: manifestFiles
  });
  await writeNdjson(path.join(CANONICAL, "spec-sections.ndjson"), sections);
  console.log(`Compiled ${manifestFiles.length} product spec files into ${sections.length} section records.`);
}

async function validateControl() {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  const add = (level: StatusLevel, message: string) => messages.push({ level, message });

  const gates = await readYamlIfExists(path.join(CANONICAL, "gates.yaml"), add);
  const fixtures = await readYamlIfExists(path.join(CANONICAL, "fixtures.yaml"), add);
  const dag = await readYamlIfExists(path.join(CANONICAL, "dag.yaml"), add);
  const profiles = await readYamlIfExists(path.join(CANONICAL, "validation-profiles.yaml"), add);
  const dagStatus = await readYamlIfExists(path.join(STATE, "dag-status.yaml"), add);
  const roles = await readYamlIfExists(path.join(CANONICAL, "roles.yaml"), add);
  const editBoundaries = await readYamlIfExists(path.join(CANONICAL, "edit-boundaries.yaml"), add);
  const sections = await readNdjsonIfExists(path.join(CANONICAL, "spec-sections.ndjson"), add);
  const assertions = await readNdjsonIfExists(path.join(CANONICAL, "assertions.ndjson"), add);
  const links = await readNdjsonIfExists(path.join(CANONICAL, "assertion-links.ndjson"), add);

  if (gates) validateArray(gates.records, gateSchema, "gate", add);
  if (fixtures) validateArray(fixtures.fixtures, fixtureSchema, "fixture", add);
  if (dag) validateArray(dag.nodes, dagNodeSchema, "dag node", add);
  if (profiles) validateArray(profiles.profiles, z.object({
    schema: z.literal("atelier.validation-profile/v1"),
    profile_id: z.string(),
    dag_node_id: z.string(),
    global_guards: z.array(z.string()),
    packet_gates: z.array(z.string()),
    test_commands: z.array(z.string()),
    evidence_required: z.array(z.string())
  }).passthrough(), "validation profile", add);
  if (dagStatus) validateArray(dagStatus.records, z.object({
    schema: z.literal("atelier.dag-status/v1"),
    dag_node_id: z.string(),
    status: z.enum(["not_started", "ready", "in_flight", "blocked", "implemented", "validated", "accepted", "superseded"]),
    completed_packet_ids: z.array(z.string()),
    blocker_ids: z.array(z.string()),
    evidence_ids: z.array(z.string()),
    updated_at: z.string()
  }).passthrough(), "dag status", add);
  if (roles) validateArray(roles.roles, roleSchema, "role", add);
  if (editBoundaries) validateArray(editBoundaries.boundaries, editBoundarySchema, "edit boundary", add);
  validateArray(sections, sectionSchema, "spec section", add);
  validateArray(assertions, assertionSchema, "assertion", add);
  validateArray(links, linkSchema, "assertion link", add);

  const gateIds = duplicateCheck(gates?.records ?? [], "gate_id", add, "gate id");
  const fixtureIds = duplicateCheck(fixtures?.fixtures ?? [], "fixture_id", add, "fixture id");
  const sectionIds = duplicateCheck(sections, "section_id", add, "section id");
  const assertionIds = duplicateCheck(assertions, "assertion_id", add, "assertion id");

  for (const link of links) {
    if (link.status === "legacy_unresolved") add("error", `legacy_unresolved link remains: ${link.link_id}`);
    if (link.assertion_id && !assertionIds.has(link.assertion_id)) add("error", `assertion link ${link.link_id} references missing assertion ${link.assertion_id}`);
    if (link.source_section_id && !sectionIds.has(link.source_section_id)) add("error", `assertion link ${link.link_id} references missing source section ${link.source_section_id}`);
    for (const gateId of link.gate_ids ?? []) {
      if (!gateIds.has(gateId) && !["deferred", "oracle_gap"].includes(link.status)) add("error", `assertion link ${link.link_id} references missing gate ${gateId}`);
    }
    for (const fixtureId of link.fixture_ids ?? []) {
      if (!["N/A", "oracle_gap", "pending_command_implementation"].includes(fixtureId) && !fixtureIds.has(fixtureId)) {
        if (link.status === "pending_command_implementation" || link.status === "oracle_gap") add("warning", `assertion link ${link.link_id} references deferred fixture ${fixtureId}`);
        else add("error", `assertion link ${link.link_id} references missing fixture ${fixtureId}`);
      }
    }
  }

  for (const node of dag?.nodes ?? []) {
    if (!Array.isArray(node.allowed_file_globs) || node.allowed_file_globs.length === 0) add("error", `DAG node ${node.dag_node_id} has empty allowed_file_globs`);
    if (!Array.isArray(node.owns_assertion_ids) || node.owns_assertion_ids.length === 0) add("error", `DAG node ${node.dag_node_id} owns no normalized assertions`);
    for (const gateId of node.required_gate_ids ?? []) {
      if (!gateIds.has(gateId)) add("error", `DAG node ${node.dag_node_id} references missing gate ${gateId}`);
    }
  }

  await validatePackets(gateIds, add);
  await validateProductSpecDrift(add);
  await validateLegacyManifest(add);
  await validateRenderedViews(add);
  collectValidationMessages(await validateGraphState(), add);
  collectValidationMessages(await validateCoverageState(), add);
  collectValidationMessages(await validateDispatchableTestContracts(), add);
  collectValidationMessages(await validateFixtureState({ detailed: false }), add);
  if ((assertions ?? []).some((assertion: any) => assertion.testability === "semantic_review")) {
    add("warning", "semantic review assertions are present");
  }

  const errors = messages.filter((message) => message.level === "error");
  for (const message of messages) console.log(`${message.level}: ${message.message}`);
  console.log(`info: validation completed with ${errors.length} errors and ${messages.filter((message) => message.level === "warning").length} warnings`);
  if (errors.length > 0) process.exit(1);
}

async function queryContext(args: Record<string, string | boolean>) {
  const dagId = String(args.dag ?? "");
  if (!dagId) throw new Error("Missing --dag <DAG-ID>");
  const result = await buildQueryResult(dagId);
  if ((args.format ?? "json") === "md") {
    console.log(renderQueryMd(result));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

async function createPacket(args: Record<string, string | boolean>) {
  const dagId = String(args.dag ?? "");
  if (!dagId) throw new Error("Missing --dag <DAG-ID>");
  const query = await buildQueryResult(dagId);
  const profile = await validationProfileForDag(dagId);
  const dagDoc = await readYaml(path.join(CANONICAL, "dag.yaml"));
  const node = (dagDoc.nodes ?? []).find((item: any) => item.dag_node_id === dagId);
  const dispatchability = node ? await assessDispatchability(node) : { ready: false, reasons: ["unknown dag node"] };
  const dispatchBlockingBlockers = query.blockers.filter((blocker: any) => ["open", "partial", "unknown"].includes(blocker.status));
  const allowBlocked = Boolean(args["allow-blocked"]);
  const blockingReasons = [
    ...dispatchBlockingBlockers.map((blocker: any) => `blocker ${blocker.blocker_id} (${blocker.status}, ${blocker.severity ?? "unknown"})`),
    ...(dispatchability.ready ? [] : dispatchability.reasons)
  ];
  if (blockingReasons.length > 0 && !allowBlocked) {
    console.error(`Blocked packet dispatch for ${dagId}. Use --allow-blocked to emit a blocked review packet.`);
    for (const reason of blockingReasons) console.error(`- ${reason}`);
    process.exit(1);
  }
  const packet = {
    schema: "atelier.packet/v1",
    packet_id: `PKT-${dagId}-${shortHash(JSON.stringify(query))}`,
    status: blockingReasons.length > 0 ? "blocked" : "draft",
    dispatchability_reasons: dispatchability.reasons,
    dag_node_ids: [dagId],
    title: query.title ?? dagId,
    goal: `Implement ${query.title ?? dagId} using only the bounded context in this packet.`,
    subagent_contract: subagentContractRules(),
    non_goals: [
      "Do not edit product specs.",
      "Do not read the full product-spec pack during ordinary implementation.",
      "Do not modify the main Atelier CLI for implementation-control scripts."
    ],
    required_source_sections: query.source_sections.map((section: any) => ({
      section_id: section.section_id,
      source_path: section.source_path,
      heading_path: section.heading_path,
      start_line: section.start_line,
      end_line: section.end_line
    })),
    source_read_commands: query.source_sections.map((section: any) => `sed -n '${section.start_line},${section.end_line}p' ${section.source_path}`),
    assertions: query.assertions.map((assertion: any) => ({
      assertion_id: assertion.assertion_id,
      text: assertion.text,
      modality: assertion.modality,
      severity: assertion.severity,
      testability: assertion.testability
    })),
    allowed_files: query.allowed_files,
    forbidden_files: query.forbidden_files,
    required_gates: query.gates.map((gate: any) => gate.gate_id),
    required_fixtures: query.fixtures.map((fixture: any) => fixture.fixture_id),
    required_tests: query.gates.map((gate: any) => ({
      name: `${dagId}-${gate.gate_id}`,
      test_command: profile.test_commands.find((command: string) => command.includes(gate.gate_id)) ?? gate.command ?? "packet-specific test command must be resolved before implementation",
      expected_failure_before_implementation: "Failing or missing test must be recorded before implementation when practical.",
      expected_pass_after_implementation: "Packet-specific validation command passes and writes evidence.",
      negative_cases: gate.negative_cases ?? []
    })),
    validation_profile: profile,
    acceptance_criteria: query.assertions.map((assertion: any) => assertion.text).slice(0, 20),
    evidence_expectations: query.gates.map((gate: any) => ({
      gate_id: gate.gate_id,
      expected_artifact: gate.proof_artifact ?? `state/evidence/${gate.gate_id}.json`
    })),
    blockers: query.blockers,
    resume_behavior: [
      "If interrupted, append an in-flight entry to state/packets/in-flight.yaml before returning.",
      "On resume, run `bun run resume` to confirm packet and frontier state, then continue from the last recorded evidence and handoff.",
      "Do not re-run completed packet work; resume only at the next sub-step inside this packet.",
      "If packet context is missing on resume, return a blocker instead of exploring unrelated Markdown."
    ],
    failure_policy: [
      "Do not dispatch implementation work while packet status is blocked.",
      "Fail closed on missing gates, missing fixtures, product-spec drift, or forbidden file requirements.",
      "Record blockers rather than guessing when packet context is insufficient.",
      "Run required validation before claiming packet completion."
    ]
  };
  packetSchema.parse(packet);
  await appendPacketLifecycle("packet_generated", packet.packet_id, dagId, packet.status, dispatchability.reasons);
  if (args.out) {
    const outPath = path.resolve(process.cwd(), String(args.out));
    await mkdir(path.dirname(outPath), { recursive: true });
    await writeFile(outPath, YAML.stringify(packet));
  }
  if ((args.format ?? "md") === "yaml") console.log(YAML.stringify(packet));
  else console.log(renderPacketMd(packet));
}

async function renderViews() {
  await mkdir(VIEWS, { recursive: true });
  await appendLedger("view_rendered", "views", viewFiles.map((file) => `views/${file}`), "Rendered implementation-control views.");
  const rendered = await renderViewsToStrings();
  for (const [file, body] of Object.entries(rendered)) await writeView(file, body);
  console.log(`Rendered ${Object.keys(rendered).length} generated view files.`);
}

async function createLlmJobs(args: Record<string, string | boolean>) {
  const kind = String(args.kind ?? "assertions");
  if (!["assertions", "ambiguity", "links", "kernel"].includes(kind)) throw new Error(`Unsupported --kind: ${kind}`);
  const sections = await readNdjson(path.join(CANONICAL, "spec-sections.ndjson"));
  const outDir = path.join(STATE, "llm-jobs", kind);
  await mkdir(outDir, { recursive: true });
  let count = 0;
  for (const section of sections) {
    const text = await readTextRef(section.text_ref);
    const jobId = `${kind}-${section.section_id.toLowerCase()}`;
    const body = kind === "assertions" ? assertionJob(jobId, section, text) : genericJob(kind, jobId, section, text);
    await writeFile(path.join(outDir, `${jobId}.md`), body);
    count += 1;
  }
  console.log(`Created ${count} ${kind} LLM job files under ${slash(path.relative(ROOT, outDir))}.`);
}

async function acceptLlmOutput(args: Record<string, string | boolean>) {
  const input = String(args.input ?? "");
  if (!input) throw new Error("Missing --input <glob-or-path>");
  const files = await resolveInputFiles(input);
  const sections = await readNdjson(path.join(CANONICAL, "spec-sections.ndjson"));
  const sectionIds = new Set(sections.map((section: any) => section.section_id));
  const existing = existsSync(path.join(CANONICAL, "assertions.ndjson")) ? await readNdjson(path.join(CANONICAL, "assertions.ndjson")) : [];
  const seen = new Set(existing.map((assertion: any) => assertion.assertion_id));
  const accepted = [];
  const report = [];
  for (const file of files) {
    const lines = (await readFile(file, "utf8")).split(/\r?\n/).filter((line) => line.trim().length > 0);
    for (const [index, line] of lines.entries()) {
      try {
        const raw = JSON.parse(line);
        const parsed = assertionSchema.omit({ schema: true, assertion_id: true }).parse(raw);
        if (!sectionIds.has(parsed.source_section_id)) throw new Error(`unknown source_section_id ${parsed.source_section_id}`);
        const assertion = {
          schema: "atelier.assertion/v1",
          assertion_id: `AST-${parsed.domain.toUpperCase()}-${shortHash(`${parsed.source_section_id}:${parsed.modality}:${normalizeText(parsed.text)}`)}`,
          ...parsed
        };
        if (seen.has(assertion.assertion_id)) {
          report.push({ file: slash(path.relative(ROOT, file)), line: index + 1, status: "duplicate", assertion_id: assertion.assertion_id });
          continue;
        }
        seen.add(assertion.assertion_id);
        accepted.push(assertion);
        report.push({ file: slash(path.relative(ROOT, file)), line: index + 1, status: "accepted", assertion_id: assertion.assertion_id });
      } catch (error) {
        report.push({ file: slash(path.relative(ROOT, file)), line: index + 1, status: "rejected", error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  await writeNdjson(path.join(CANONICAL, "assertions.ndjson"), [...existing, ...accepted]);
  const reportPath = path.join(STATE, "llm-inbox", `accept-report-${timestamp()}.json`);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeJson(reportPath, { schema: "atelier.llm-accept-report/v1", generated_at: new Date().toISOString(), input_files: files.map((file) => slash(path.relative(ROOT, file))), accepted: accepted.length, report });
  console.log(`Accepted ${accepted.length} LLM assertion records. Report: ${slash(path.relative(ROOT, reportPath))}`);
}

async function frontier(args: Record<string, string | boolean>) {
  const result = await computeFrontier();
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log(`# Frontier\n`);
    console.log(`generated_at: ${result.generated_at}`);
    console.log(`\n## Completed\n`);
    console.log(result.completed.map((node: any) => `- ${node.dag_node_id}: ${node.status}`).join("\n") || "- none");
    console.log(`\n## Ready\n`);
    console.log(result.ready.map((node: any) => `- ${node.dag_node_id}: ${node.title}\n  reason: ${node.reason}\n  packet: ${node.packet_command}`).join("\n") || "- none");
    console.log(`\n## Blocked\n`);
    console.log(result.blocked.map((node: any) => `- ${node.dag_node_id}\n  blockers: ${node.blockers.join(", ") || "none"}\n  repairs: ${node.required_repairs.join("; ")}`).join("\n") || "- none");
  }
}

async function resume(args: Record<string, string | boolean>) {
  const plan = await computeResumePlan();
  if (args.json) console.log(JSON.stringify(plan, null, 2));
  else {
    console.log(`# Resume Plan\n`);
    console.log(`active_packets: ${plan.current_state.active_packets.join(", ") || "none"}`);
    console.log(`blocked_packets: ${plan.current_state.blocked_packets.join(", ") || "none"}`);
    console.log(`completed_dag_nodes: ${plan.current_state.completed_dag_nodes.join(", ") || "none"}`);
    console.log(`next_frontier: ${plan.current_state.next_frontier.join(", ") || "none"}`);
    console.log(`\n## Resume Steps\n${plan.resume_steps.map((step: string) => `- ${step}`).join("\n")}`);
    console.log(`\n## Safety Checks\n${plan.safety_checks.map((step: string) => `- ${step}`).join("\n")}`);
    console.log(`\n## Next Commands\n${plan.next_commands.map((command: string) => `- \`${command}\``).join("\n")}`);
  }
}

async function graph(args: Record<string, string | boolean>) {
  const graphData = await buildGraphData();
  await mkdir(path.join(STATE, "graph"), { recursive: true });
  await mkdir(VIEWS, { recursive: true });
  await writeJson(path.join(STATE, "graph/implementation-graph.json"), graphData);
  const mmd = renderMermaidGraph(graphData);
  await writeFile(path.join(VIEWS, "IMPLEMENTATION_GRAPH.mmd"), mmd);
  const rendered = await renderViewsToStrings();
  await writeView("IMPLEMENTATION_GRAPH.md", rendered["IMPLEMENTATION_GRAPH.md"]);
  if (args.json) console.log(JSON.stringify(graphData, null, 2));
  else console.log(`Generated graph artifacts: views/IMPLEMENTATION_GRAPH.mmd, views/IMPLEMENTATION_GRAPH.md, state/graph/implementation-graph.json`);
}

async function cleanupPlan(args: Record<string, string | boolean>) {
  const plan = await computeCleanupPlan();
  if (args.json) console.log(JSON.stringify(plan, null, 2));
  else console.log(renderCleanupPlanMd(plan));
}

async function cleanupApply(args: Record<string, string | boolean>) {
  const plan = await computeCleanupPlan();
  if (!args.yes) {
    console.log("Dry run. Re-run with --yes to apply safe cleanup actions.");
    console.log(renderCleanupPlanMd(plan));
    return;
  }
  const archiveRoot = path.join(ROOT, "archive/legacy-root-docs-2026-06-04");
  await mkdir(archiveRoot, { recursive: true });
  for (const item of plan.items.filter((entry: any) => entry.classification === "safe_to_remove" && rootMarkdownDocs.includes(path.basename(entry.path)))) {
    const source = path.join(ROOT, item.path);
    if (!existsSync(source)) continue;
    await copyFile(source, path.join(archiveRoot, path.basename(item.path)));
    await rm(source);
  }
  for (const item of plan.items.filter((entry: any) => entry.classification === "safe_to_remove" && String(entry.path).startsWith("state/llm-jobs/"))) {
    const source = path.join(ROOT, item.path);
    if (existsSync(source)) await rm(source);
  }
  await writeRootReadme();
  console.log(`Applied cleanup. Legacy root docs moved to ${slash(path.relative(ROOT, archiveRoot))}.`);
}

async function validatePacketCommand(args: Record<string, string | boolean>) {
  const packetPath = String(args.packet ?? "");
  if (!packetPath) throw new Error("Missing --packet <path>");
  const packet = await readPacketFromPath(path.resolve(process.cwd(), packetPath));
  const messages = await validatePacketObject(packet);
  printValidationMessages(messages);
}

async function validateGraphCommand(args: Record<string, string | boolean>) {
  const messages = await validateGraphState();
  printValidationMessages(messages);
}

async function validateFixturesCommand(args: Record<string, string | boolean>) {
  const messages = await validateFixtureState({ detailed: args.summary !== true });
  printValidationMessages(messages);
}

async function validateTestsCommand(args: Record<string, string | boolean>) {
  const messages = args.packet ? await validatePacketTests(await readPacketFromPath(path.resolve(process.cwd(), String(args.packet)))) : await validateDispatchableTestContracts();
  printValidationMessages(messages);
}

async function validateCoverageCommand(args: Record<string, string | boolean>) {
  const messages = await validateCoverageState();
  printValidationMessages(messages);
}

async function computeFrontier() {
  const dag = await readYaml(path.join(CANONICAL, "dag.yaml"));
  const statuses = await readDagStatuses();
  const ready = [];
  const blocked = [];
  const completed = [];
  for (const node of dag.nodes ?? []) {
    const nodeStatus = statuses.get(node.dag_node_id)?.status;
    if (isDagDependencySatisfied(nodeStatus)) {
      completed.push({
        dag_node_id: node.dag_node_id,
        title: node.title,
        status: nodeStatus
      });
      continue;
    }
    const blockers = await dispatchBlockersForDag(node.dag_node_id);
    const dependencyProblems = (node.depends_on ?? []).filter((dep: string) => !isDagDependencySatisfied(statuses.get(dep)?.status));
    const readiness = await assessDispatchability(node);
    if (blockers.length === 0 && dependencyProblems.length === 0 && readiness.ready) {
      ready.push({
        dag_node_id: node.dag_node_id,
        title: node.title,
        reason: "dependencies satisfied and packet profile can be generated",
        packet_command: `bun run packet -- --dag ${node.dag_node_id} --format md`
      });
    } else {
      blocked.push({
        dag_node_id: node.dag_node_id,
        blockers: unique([...blockers.map((blocker: any) => blocker.blocker_id), ...dependencyProblems.map((dep: string) => `dependency:${dep}`)]),
        required_repairs: unique([
          ...readiness.reasons,
          ...dependencyProblems.map((dep: string) => `complete dependency ${dep} with accepted, validated, or implemented evidence (current: ${statuses.get(dep)?.status ?? "missing"})`)
        ])
      });
    }
  }
  return {
    schema: "atelier.frontier/v1",
    generated_at: new Date().toISOString(),
    completed,
    ready,
    blocked
  };
}

async function computeResumePlan() {
  const frontierResult = await computeFrontier();
  const packetFiles = existsSync(path.join(STATE, "packets")) ? await listFiles(path.join(STATE, "packets")) : [];
  const statuses = [...(await readDagStatuses()).values()];
  const completedPacketIds = new Set(
    statuses
      .filter((status: any) => COMPLETED_DAG_STATUSES.has(status.status))
      .flatMap((status: any) => status.completed_packet_ids ?? [])
  );
  const activePackets = [];
  for (const file of packetFiles.filter((file) => file.endsWith(".yaml") && !file.endsWith("in-flight.yaml"))) {
    const packet = await readYaml(file).catch(() => null);
    const packetId = String(packet?.packet_id ?? "");
    const packetStatus = String(packet?.status ?? "");
    if (packetId && completedPacketIds.has(packetId)) continue;
    if (CLOSED_PACKET_STATUSES.has(packetStatus)) continue;
    if (ACTIVE_PACKET_STATUSES.has(packetStatus)) activePackets.push(slash(path.relative(ROOT, file)));
  }
  return {
    schema: "atelier.resume-plan/v1",
    current_state: {
      active_packets: activePackets.slice(0, 20),
      blocked_packets: statuses.filter((status: any) => status.status === "blocked").map((status: any) => status.dag_node_id),
      completed_dag_nodes: statuses.filter((status: any) => ["implemented", "validated", "accepted"].includes(status.status)).map((status: any) => status.dag_node_id),
      next_frontier: frontierResult.ready.map((node: any) => node.dag_node_id)
    },
    resume_steps: [
      "Run bun run validate to confirm control state.",
      "Run bun run frontier to select the next dispatchable DAG node.",
      "Generate one packet from a ready frontier node.",
      "Dispatch only the packet plus views/SUBAGENT_CONTRACT.md.",
      "If no ready node exists, open repair work for the first blocked node reason."
    ],
    safety_checks: [
      "Product specs must remain unchanged.",
      "Views must be generated and current.",
      "Packet-specific validation profile must exist before dispatch.",
      "P0/P1 blockers prevent implementation dispatch."
    ],
    next_commands: frontierResult.ready.length > 0
      ? ["bun run validate", "bun run frontier", frontierResult.ready[0].packet_command]
      : ["bun run validate", "bun run frontier", "bun run cleanup:plan"]
  };
}

async function buildGraphData() {
  const dag = await readYaml(path.join(CANONICAL, "dag.yaml"));
  const statuses = await readDagStatuses();
  const nodes = [];
  const edges = [];
  for (const node of dag.nodes ?? []) {
    const blockers = await readBlockersForDag(node.dag_node_id);
    nodes.push({
      dag_node_id: node.dag_node_id,
      title: node.title,
      status: statuses.get(node.dag_node_id)?.status ?? "not_started",
      blockers: blockers.map((blocker: any) => blocker.blocker_id),
      required_gates: node.required_gate_ids,
      packet_links: [],
      evidence_links: statuses.get(node.dag_node_id)?.evidence_ids ?? []
    });
    for (const dep of node.depends_on ?? []) edges.push({ from: dep, to: node.dag_node_id });
  }
  return {
    schema: "atelier.implementation-graph/v1",
    generated_at: new Date().toISOString(),
    nodes,
    edges
  };
}

function renderMermaidGraph(graphData: any) {
  const lines = ["flowchart TD"];
  for (const node of graphData.nodes) lines.push(`  ${mermaidId(node.dag_node_id)}["${node.dag_node_id}<br/>${node.status}"]`);
  for (const edge of graphData.edges) lines.push(`  ${mermaidId(edge.from)} --> ${mermaidId(edge.to)}`);
  return `${lines.join("\n")}\n`;
}

async function computeCleanupPlan() {
  const referenced = await referencedPaths();
  const items = [];
  for (const doc of rootMarkdownDocs) {
    const exists = existsSync(path.join(ROOT, doc));
    items.push({
      path: doc,
      classification: exists ? "safe_to_remove" : "legacy_archive",
      reason: exists ? "legacy root doc is preserved under state/legacy/root-docs and should not be an active entrypoint" : "already absent from active root"
    });
  }
  for (const file of existsSync(path.join(STATE, "llm-jobs")) ? await listFiles(path.join(STATE, "llm-jobs")) : []) {
    const rel = slash(path.relative(ROOT, file));
    items.push({
      path: rel,
      classification: referenced.has(rel) ? "blocked_from_removal" : "safe_to_remove",
      reason: "generated LLM jobs should be regenerated on demand"
    });
  }
  for (const view of viewFiles) items.push({ path: `views/${view}`, classification: "generated_view", reason: "generated human control surface" });
  items.push({ path: "canonical/**", classification: "active_source", reason: "machine-queryable source of truth" });
  items.push({ path: "state/evidence/**", classification: "active_source", reason: "validation evidence must never be deleted by cleanup" });
  items.push({ path: "state/legacy/**", classification: "legacy_archive", reason: "audit archive; not active context" });
  return {
    schema: "atelier.cleanup-plan/v1",
    generated_at: new Date().toISOString(),
    items
  };
}

function renderCleanupPlanMd(plan: any) {
  return `# Cleanup Plan

${plan.items.map((item: any) => `- ${item.classification}: ${item.path}\n  reason: ${item.reason}`).join("\n")}
`;
}

async function validatePacketObject(packet: any) {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  const parsed = packetSchema.safeParse(packet);
  if (!parsed.success) messages.push({ level: "error", message: `packet schema invalid: ${parsed.error.message}` });
  const sections = await readNdjson(path.join(CANONICAL, "spec-sections.ndjson"));
  const assertions = await readNdjson(path.join(CANONICAL, "assertions.ndjson"));
  const gates = await readYaml(path.join(CANONICAL, "gates.yaml"));
  const fixtures = await readYaml(path.join(CANONICAL, "fixtures.yaml"));
  const sectionIds = new Set(sections.map((section: any) => section.section_id));
  const assertionIds = new Set(assertions.map((assertion: any) => assertion.assertion_id));
  const gateIds = new Set((gates.records ?? []).map((gate: any) => gate.gate_id));
  const fixtureById = new Map((fixtures.fixtures ?? []).map((fixture: any) => [fixture.fixture_id, fixture]));
  for (const section of packet.required_source_sections ?? []) if (!sectionIds.has(section.section_id)) messages.push({ level: "error", message: `missing source section ${section.section_id}` });
  for (const assertion of packet.assertions ?? []) if (!assertionIds.has(assertion.assertion_id)) messages.push({ level: "error", message: `missing normalized assertion ${assertion.assertion_id}` });
  if ((packet.allowed_files ?? []).length === 0) messages.push({ level: "error", message: "allowed_files is empty" });
  for (const gateId of packet.required_gates ?? []) if (!gateIds.has(gateId)) messages.push({ level: "error", message: `missing gate ${gateId}` });
  for (const fixtureId of packet.required_fixtures ?? []) {
    const fixture = fixtureById.get(fixtureId) as any;
    if (!fixture) messages.push({ level: "error", message: `missing fixture ${fixtureId}` });
    else if (fixture.status !== "executable") messages.push({ level: "error", message: `fixture is not executable: ${fixtureId}` });
  }
  if (!packet.validation_profile?.profile_id) messages.push({ level: "error", message: "missing validation profile" });
  if ((packet.required_tests ?? []).length === 0) messages.push({ level: "error", message: "missing TDD requirements" });
  if ((packet.evidence_expectations ?? []).length === 0) messages.push({ level: "error", message: "missing evidence expectations" });
  for (const blocker of packet.blockers ?? []) {
    if (["open", "partial", "unknown"].includes(blocker.status) && blocker.severity !== "P2") messages.push({ level: "error", message: `P0/P1 blocker affects packet: ${blocker.blocker_id}` });
  }
  return messages;
}

async function validateGraphState() {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  const dag = await readYaml(path.join(CANONICAL, "dag.yaml"));
  const ids = new Set((dag.nodes ?? []).map((node: any) => node.dag_node_id));
  const statuses = await readDagStatuses();
  for (const status of statuses.values()) {
    if (!ids.has(status.dag_node_id)) messages.push({ level: "error", message: `status references missing DAG node ${status.dag_node_id}` });
  }
  for (const node of dag.nodes ?? []) {
    if (!statuses.has(node.dag_node_id)) messages.push({ level: "error", message: `DAG node missing runtime status ${node.dag_node_id}` });
    for (const dep of node.depends_on ?? []) {
      if (!ids.has(dep)) messages.push({ level: "error", message: `${node.dag_node_id} depends on missing node ${dep}` });
    }
  }
  for (const cycle of findCycles(dag.nodes ?? [])) messages.push({ level: "error", message: `DAG cycle: ${cycle.join(" -> ")}` });
  const frontierResult = await computeFrontier().catch((error) => {
    messages.push({ level: "error", message: `frontier not computable: ${error.message}` });
    return null;
  });
  if (frontierResult) {
    const readyIds = new Set(frontierResult.ready.map((node: any) => node.dag_node_id));
    const blockedIds = new Set(frontierResult.blocked.map((node: any) => node.dag_node_id));
    const completedIds = new Set((frontierResult.completed ?? []).map((node: any) => node.dag_node_id));
    for (const id of ids) {
      if (readyIds.has(id) && blockedIds.has(id)) messages.push({ level: "error", message: `frontier classifies ${id} as both ready and blocked` });
      if (completedIds.has(id) && (readyIds.has(id) || blockedIds.has(id))) messages.push({ level: "error", message: `frontier includes completed DAG node ${id} as active` });
      if (!completedIds.has(id) && !readyIds.has(id) && !blockedIds.has(id)) messages.push({ level: "error", message: `frontier omits active DAG node ${id}` });
    }
    for (const node of dag.nodes ?? []) {
      const incompleteDeps = (node.depends_on ?? []).filter((dep: string) => !isDagDependencySatisfied(statuses.get(dep)?.status));
      if (readyIds.has(node.dag_node_id) && incompleteDeps.length > 0) {
        messages.push({ level: "error", message: `${node.dag_node_id} is ready with incomplete dependencies: ${incompleteDeps.join(", ")}` });
      }
    }
    for (const blocked of frontierResult.blocked) {
      if ((blocked.blockers ?? []).length === 0 && (blocked.required_repairs ?? []).length === 0) {
        messages.push({ level: "error", message: `${blocked.dag_node_id} is blocked without blockers or repair reasons` });
      }
    }
  }
  for (const file of ["views/IMPLEMENTATION_GRAPH.mmd", "views/IMPLEMENTATION_GRAPH.md", "state/graph/implementation-graph.json"]) {
    if (!existsSync(path.join(ROOT, file))) messages.push({ level: "error", message: `graph artifact missing: ${file}` });
  }
  const currentGraph = await buildGraphData();
  const currentStableGraph = stableGraphData(currentGraph);
  const graphJsonPath = path.join(STATE, "graph/implementation-graph.json");
  if (existsSync(graphJsonPath)) {
    try {
      const stored = JSON.parse(await readFile(graphJsonPath, "utf8"));
      if (JSON.stringify(stableGraphData(stored)) !== JSON.stringify(currentStableGraph)) {
        messages.push({ level: "error", message: "graph artifact stale: state/graph/implementation-graph.json" });
      }
    } catch (error) {
      messages.push({ level: "error", message: `invalid graph artifact JSON: ${error instanceof Error ? error.message : String(error)}` });
    }
  }
  const mermaidPath = path.join(VIEWS, "IMPLEMENTATION_GRAPH.mmd");
  if (existsSync(mermaidPath)) {
    const mermaid = await readFile(mermaidPath, "utf8");
    if (mermaid !== renderMermaidGraph(currentGraph)) messages.push({ level: "error", message: "graph artifact stale: views/IMPLEMENTATION_GRAPH.mmd" });
  }
  return messages;
}

async function validateCoverageState() {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  const assertions = await readNdjson(path.join(CANONICAL, "assertions.ndjson"));
  const links = await readNdjson(path.join(CANONICAL, "assertion-links.ndjson"));
  const sections = await readNdjson(path.join(CANONICAL, "spec-sections.ndjson"));
  if (assertions.length === 0) messages.push({ level: "error", message: "canonical assertions are empty" });
  const linkedIds = new Set(links.map((link: any) => link.assertion_id).filter(Boolean));
  const coveredSectionIds = new Set(assertions.map((assertion: any) => assertion.source_section_id).filter(Boolean));
  for (const link of links) {
    if (link.source_section_id) coveredSectionIds.add(link.source_section_id);
    for (const sectionId of resolveAllLegacySectionIds(link, sections)) coveredSectionIds.add(sectionId);
  }
  for (const assertion of assertions) {
    if (!assertion.source_section_id) messages.push({ level: "error", message: `assertion missing source section: ${assertion.assertion_id}` });
    if (!linkedIds.has(assertion.assertion_id)) messages.push({ level: "error", message: `assertion not linked: ${assertion.assertion_id}` });
  }
  const unresolved = links.filter((link: any) => link.status === "legacy_unresolved");
  if (unresolved.length > 0) messages.push({ level: "error", message: `${unresolved.length} legacy_unresolved links remain` });
  const unclassifiedLikelyNormative = sections.filter((section: any) => !coveredSectionIds.has(section.section_id) && /must|shall|required|invariant|never|only/i.test(section.heading_path.join(" "))).length;
  if (unclassifiedLikelyNormative > 0) messages.push({ level: "warning", message: `${unclassifiedLikelyNormative} likely normative sections are unclassified by heuristic` });
  return messages;
}

async function validatePacketTests(packet: any) {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  for (const test of packet.required_tests ?? []) {
    if (!test.name) messages.push({ level: "error", message: "test contract missing name" });
    if (!test.test_command || test.test_command.includes("must be resolved")) messages.push({ level: "error", message: `test command unresolved for ${test.name}` });
    if ((test.negative_cases ?? []).length === 0) messages.push({ level: "error", message: `negative cases missing for ${test.name}` });
    if (!test.expected_failure_before_implementation) messages.push({ level: "error", message: `failure-before state missing for ${test.name}` });
    if (!test.expected_pass_after_implementation) messages.push({ level: "error", message: `pass-after state missing for ${test.name}` });
  }
  if ((packet.required_tests ?? []).length === 0) messages.push({ level: "error", message: "packet has no required tests" });
  return messages;
}

async function validateDispatchableTestContracts() {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  const frontierResult = await computeFrontier();
  if (frontierResult.ready.length === 0) messages.push({ level: "warning", message: "no dispatchable implementation packets; no dispatchable test contracts to validate" });
  for (const ready of frontierResult.ready) {
    const query = await buildQueryResult(ready.dag_node_id);
    const profile = await validationProfileForDag(ready.dag_node_id);
    if (query.assertions.length === 0) messages.push({ level: "error", message: `${ready.dag_node_id} has no assertions for dispatchable packet` });
    if (query.source_sections.length === 0) messages.push({ level: "error", message: `${ready.dag_node_id} has no source sections for dispatchable packet` });
    if (query.gates.length === 0) messages.push({ level: "error", message: `${ready.dag_node_id} has no gates for dispatchable packet` });
    for (const fixture of query.fixtures) {
      if (fixture.status !== "executable") messages.push({ level: "error", message: `${ready.dag_node_id} dispatchable fixture is not executable: ${fixture.fixture_id}` });
    }
    for (const gate of query.gates) {
      if (!profile.packet_gates.includes(gate.gate_id)) messages.push({ level: "error", message: `${ready.dag_node_id} validation profile omits gate ${gate.gate_id}` });
      const testCommand = profile.test_commands.find((command: string) => command.includes(gate.gate_id)) ?? gate.command;
      if (!testCommand || testCommand.includes("pending") || testCommand.includes("must be resolved")) {
        messages.push({ level: "error", message: `${ready.dag_node_id} has unresolved test command for ${gate.gate_id}` });
      }
      if ((gate.negative_cases ?? []).length === 0) messages.push({ level: "error", message: `${ready.dag_node_id} gate ${gate.gate_id} has no negative cases` });
      if (!gate.executable_now) messages.push({ level: "warning", message: `${ready.dag_node_id} gate ${gate.gate_id} is marked non-executable` });
    }
  }
  return messages;
}

async function validateFixtureState(options: { detailed: boolean }) {
  const messages: Array<{ level: StatusLevel; message: string }> = [];
  const fixturesDoc = await readYaml(path.join(CANONICAL, "fixtures.yaml")).catch((error) => {
    messages.push({ level: "error", message: `fixtures not readable: ${error instanceof Error ? error.message : String(error)}` });
    return { fixtures: [] };
  });
  const fixtures = fixturesDoc.fixtures ?? [];
  const pending = fixtures.filter((fixture: any) => fixture.status === "pending_command_implementation");
  const oracleGaps = fixtures.filter((fixture: any) => fixture.status === "oracle_gap");
  const readyFixtureIds = await fixtureIdsForReadyFrontier();

  for (const fixture of fixtures) {
    for (const field of ["command_file", "input_path", "expected_path"] as const) {
      const value = fixture[field];
      if (!value) continue;
      const absolute = path.join(REPO_ROOT, String(value));
      if (fixture.status === "executable" && !existsSync(absolute)) {
        messages.push({ level: "error", message: `executable fixture ${fixture.fixture_id} has missing ${field}: ${value}` });
      } else if (options.detailed && !existsSync(absolute)) {
        messages.push({ level: "warning", message: `${fixture.status} fixture ${fixture.fixture_id} has missing ${field}: ${value}` });
      }
    }
    if (fixture.status === "executable" && fixture.command_file && existsSync(path.join(REPO_ROOT, fixture.command_file))) {
      const commandText = await readFile(path.join(REPO_ROOT, fixture.command_file), "utf8").catch(() => "");
      if (commandText.includes("fixture_not_yet_implemented")) {
        messages.push({ level: "error", message: `executable fixture ${fixture.fixture_id} command is still a placeholder` });
      }
    }
  }

  const pendingInReadyFrontier = pending.filter((fixture: any) => readyFixtureIds.has(fixture.fixture_id));
  if (options.detailed) {
    for (const fixture of pending) messages.push({ level: "warning", message: `pending fixture command implementation: ${fixture.fixture_id}` });
    for (const fixture of oracleGaps) messages.push({ level: "warning", message: `oracle gap fixture: ${fixture.fixture_id}` });
  } else {
    if (pending.length > 0) {
      messages.push({
        level: "warning",
        message: `${pending.length} pending fixture command implementations (${pendingInReadyFrontier.length} in ready frontier); run \`bun run validate:fixtures\` for details`
      });
    }
    if (oracleGaps.length > 0) {
      messages.push({ level: "warning", message: `${oracleGaps.length} oracle gap fixtures; run \`bun run validate:fixtures\` for details` });
    }
  }
  return messages;
}

async function fixtureIdsForReadyFrontier() {
  const ids = new Set<string>();
  const frontierResult = await computeFrontier().catch(() => ({ ready: [] }));
  for (const ready of frontierResult.ready ?? []) {
    const query = await buildQueryResult(ready.dag_node_id).catch(() => ({ fixtures: [] }));
    for (const fixture of query.fixtures ?? []) ids.add(fixture.fixture_id);
  }
  return ids;
}

function collectValidationMessages(messages: Array<{ level: StatusLevel; message: string }>, add: (level: StatusLevel, message: string) => void) {
  for (const message of messages) add(message.level, message.message);
}

function printValidationMessages(messages: Array<{ level: StatusLevel; message: string }>) {
  for (const message of messages) console.log(`${message.level}: ${message.message}`);
  const errors = messages.filter((message) => message.level === "error");
  console.log(`info: validation completed with ${errors.length} errors and ${messages.filter((message) => message.level === "warning").length} warnings`);
  if (errors.length > 0) process.exit(1);
}

async function promoteGates(warnings: string[]) {
  const source = path.join(STATE, "gates/structured-gates-2026-06-04.yaml");
  if (!existsSync(source)) {
    warnings.push("structured gates source missing");
    return;
  }
  const legacy = await readYaml(source);
  const records = (legacy.records ?? []).map((record: any) => gateSchema.parse({
    schema: "atelier.validation-gate/v1",
    gate_id: String(record.gate_id),
    purpose: String(record.purpose ?? ""),
    fixture_id: String(record.fixture_id ?? "N/A"),
    required_input_files: toStringArray(record.required_input_files),
    required_expected_output_files: toStringArray(record.required_expected_output_files),
    positive_cases: toStringArray(record.positive_cases),
    negative_cases: toStringArray(record.negative_cases),
    command_source: String(record.command_source ?? ""),
    command_resolution_algorithm: String(record.command_resolution_algorithm ?? ""),
    command: String(record.command ?? ""),
    required_before: String(record.required_before ?? ""),
    failure_owner: String(record.failure_owner ?? ""),
    retry_policy: String(record.retry_policy ?? ""),
    blocking_severity: normalizeSeverity(record.blocking_severity),
    accepted_statuses: toStringArray(record.accepted_statuses),
    proof_artifact: String(record.proof_artifact ?? ""),
    ledger_update_required: Boolean(record.ledger_update_required),
    phase_gate_eligible: Boolean(record.phase_gate_eligible),
    executable_now: Boolean(record.executable_now)
  }));
  await writeYaml(path.join(CANONICAL, "gates.yaml"), {
    schema: "atelier.validation-gates/v1",
    generated_at: new Date().toISOString(),
    provenance: slash(path.relative(ROOT, source)),
    records
  });
}

async function promoteFixtures(warnings: string[]) {
  const source = path.join(STATE, "traceability/fixture-alias-registry-2026-06-04.yaml");
  if (!existsSync(source)) {
    warnings.push("fixture alias registry source missing");
    return;
  }
  const legacy = await readYaml(source);
  const fixtures = (legacy.fixtures ?? []).map((fixture: any) => fixtureSchema.parse({
    schema: "atelier.fixture/v1",
    fixture_id: String(fixture.fixture_id),
    command_file: normalizeLegacyControlPath(nullableString(fixture.command_file)),
    input_path: normalizeLegacyControlPath(nullableString(fixture.input_path)),
    expected_path: normalizeLegacyControlPath(nullableString(fixture.expected_path)),
    negative_case_id: nullableString(fixture.negative_case_id),
    gate_id: String(fixture.gate_id),
    status: ["executable", "pending_command_implementation", "oracle_gap"].includes(fixture.status) ? fixture.status : "pending_command_implementation",
    provenance: String(fixture.provenance ?? slash(path.relative(ROOT, source))),
    last_verified_at: nullableString(fixture.last_verified_at)
  }));
  await writeYaml(path.join(CANONICAL, "fixtures.yaml"), {
    schema: "atelier.fixtures/v1",
    generated_at: new Date().toISOString(),
    provenance: slash(path.relative(ROOT, source)),
    fixtures
  });
}

async function promoteAssertionLinksAndDag(warnings: string[]) {
  const source = path.join(STATE, "traceability/dag-02-join-table-2026-06-04.yaml");
  if (!existsSync(source)) {
    warnings.push("join table source missing");
    return;
  }
  const legacy = await readYaml(source);
  const rows = legacy.rows ?? [];
  const sections = existsSync(path.join(CANONICAL, "spec-sections.ndjson")) ? await readNdjson(path.join(CANONICAL, "spec-sections.ndjson")) : [];
  const fallbackSectionId = sections[0]?.section_id ?? "SPEC-UNRESOLVED-0000000000";
  const assertions = rows.map((row: any, index: number) => {
    const sourceSectionId = resolveLegacySectionIdFromRefs(toStringArray(row.source_sections), sections) ?? fallbackSectionId;
    const text = String(row.exact_assertion ?? `${row.dag_node_id} implementation-control assertion`);
    const domain = inferAssertionDomain(row);
    return assertionSchema.parse({
      schema: "atelier.assertion/v1",
      assertion_id: assertionIdFor(sourceSectionId, "must", text, domain),
      source_section_id: sourceSectionId,
      text,
      modality: "must",
      domain,
      testability: testabilityFromLegacyValue(row.current_contract_testability),
      severity: severityFromGateIds(toStringArray(row.validation_gate_ids)),
      closed_terms: unique([
        ...toStringArray(row.invariant_ids),
        ...toStringArray(row.owned_fields_or_enums),
        ...toStringArray(row.closed_enum_values)
      ]).slice(0, 64),
      ambiguity_status: row.traceability_status === "concrete" ? "clear" : "ambiguous",
      notes: `Deterministically promoted from ${slash(path.relative(ROOT, source))} row ${index}.`
    });
  });
  await writeNdjson(path.join(CANONICAL, "assertions.ndjson"), assertions);
  const links = rows.map((row: any, index: number) => {
    const assertion = assertions[index];
    return {
      schema: "atelier.assertion-link/v1",
      link_id: `LNK-${row.dag_node_id}-${shortHash(JSON.stringify(row) + index)}`,
      assertion_id: assertion.assertion_id,
      source_section_id: assertion.source_section_id,
      dag_node_id: String(row.dag_node_id),
      gate_ids: toStringArray(row.validation_gate_ids),
      fixture_ids: toStringArray(row.fixture_id).length > 0 ? toStringArray(row.fixture_id) : ["N/A"],
      provenance: `${slash(path.relative(ROOT, source))}#rows[${index}]`,
      status: linkStatus(row),
      legacy_source_sections: toStringArray(row.source_sections),
      legacy_assertion_text: String(row.exact_assertion ?? ""),
      legacy_allowed_files_ref: String(row.allowed_files_ref ?? ""),
      legacy_owner_role: String(row.owner_role ?? ""),
      legacy_phase_scope: String(row.phase_scope ?? ""),
      legacy_testability: String(row.current_contract_testability ?? "")
    };
  });
  await writeNdjson(path.join(CANONICAL, "assertion-links.ndjson"), links);
  const grouped = new Map<string, any[]>();
  for (const row of rows) {
    const key = String(row.dag_node_id);
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }
  const nodes = [...grouped.entries()].map(([dagNodeId, group]) => dagNodeSchema.parse({
    schema: "atelier.dag-node/v1",
    dag_node_id: dagNodeId,
    phase: firstString(group.map((row) => row.phase_scope)) ?? "unknown",
    title: titleFromDagRows(dagNodeId, group),
    depends_on: inferDependsOn(dagNodeId),
    owns_assertion_ids: links.filter((link: any) => link.dag_node_id === dagNodeId).map((link: any) => link.assertion_id),
    required_gate_ids: unique(group.flatMap((row) => toStringArray(row.validation_gate_ids))),
    allowed_file_globs: unique(group.map((row) => String(row.allowed_files_ref ?? "")).filter(Boolean)),
    expected_outputs: unique(group.map((row) => String(row.exact_assertion ?? "")).filter(Boolean)),
    owner_role: firstString(group.map((row) => row.owner_role)) ?? "unknown"
  }));
  await writeYaml(path.join(CANONICAL, "dag.yaml"), {
    schema: "atelier.dag/v1",
    generated_at: new Date().toISOString(),
    provenance: slash(path.relative(ROOT, source)),
    nodes
  });
}

async function promoteRoles(warnings: string[]) {
  const source = firstExistingPath([path.join(ROOT, "SUBAGENT_ROLE_CATALOG.md"), path.join(STATE, "legacy/root-docs/SUBAGENT_ROLE_CATALOG.md")]);
  if (!existsSync(source)) {
    warnings.push("SUBAGENT_ROLE_CATALOG.md missing; roles not promoted");
    return;
  }
  const records = markdownHeadingRecords(await readFile(source, "utf8"), "role").map((record) => ({
    schema: "atelier.role/v1",
    role_id: `ROLE-${record.slug.toUpperCase()}`,
    title: record.title,
    source_ref: `state/legacy/root-docs/SUBAGENT_ROLE_CATALOG.md:${record.start_line}-${record.end_line}`,
    summary: record.summary,
    provenance: "SUBAGENT_ROLE_CATALOG.md"
  }));
  await writeYaml(path.join(CANONICAL, "roles.yaml"), {
    schema: "atelier.roles/v1",
    generated_at: "2026-06-04T00:00:00Z",
    provenance: "state/legacy/root-docs/SUBAGENT_ROLE_CATALOG.md",
    roles: records
  });
}

async function promoteEditBoundaries(warnings: string[]) {
  const source = firstExistingPath([path.join(ROOT, "REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md"), path.join(STATE, "legacy/root-docs/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md")]);
  if (!existsSync(source)) {
    warnings.push("REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md missing; edit boundaries not promoted");
    return;
  }
  const text = await readFile(source, "utf8");
  const records = markdownHeadingRecords(text, "boundary").map((record) => ({
    schema: "atelier.edit-boundary/v1",
    boundary_id: `BOUNDARY-${record.slug.toUpperCase()}`,
    title: record.title,
    source_ref: `state/legacy/root-docs/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md:${record.start_line}-${record.end_line}`,
    summary: record.summary,
    allowed_file_globs: extractListAfterLabels(record.body, ["allowed", "editable", "mutable"]),
    forbidden_file_globs: extractListAfterLabels(record.body, ["forbidden", "non-editable", "immutable"]),
    provenance: "REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md"
  }));
  await writeYaml(path.join(CANONICAL, "edit-boundaries.yaml"), {
    schema: "atelier.edit-boundaries/v1",
    generated_at: "2026-06-04T00:00:00Z",
    provenance: "state/legacy/root-docs/REPOSITORY_DISCOVERY_AND_EDIT_BOUNDARY.md",
    boundaries: records
  });
}

async function writeOperationalState() {
  const dag = existsSync(path.join(CANONICAL, "dag.yaml")) ? await readYaml(path.join(CANONICAL, "dag.yaml")) : { nodes: [] };
  const links = existsSync(path.join(CANONICAL, "assertion-links.ndjson")) ? await readNdjson(path.join(CANONICAL, "assertion-links.ndjson")) : [];
  const gatesDoc = existsSync(path.join(CANONICAL, "gates.yaml")) ? await readYaml(path.join(CANONICAL, "gates.yaml")) : { records: [] };
  const fixturesDoc = existsSync(path.join(CANONICAL, "fixtures.yaml")) ? await readYaml(path.join(CANONICAL, "fixtures.yaml")) : { fixtures: [] };
  const statusRecords = [];
  const profiles = [];
  for (const node of dag.nodes ?? []) {
    const blockers = await readBlockersForDag(node.dag_node_id);
    const nodeLinks = links.filter((link: any) => link.dag_node_id === node.dag_node_id);
    const gateIds = unique([
      ...toStringArray(node.required_gate_ids),
      ...nodeLinks.flatMap((link: any) => toStringArray(link.gate_ids))
    ]);
    const fixtureIds = unique(nodeLinks.flatMap((link: any) => toStringArray(link.fixture_ids))).filter((fixtureId) => fixtureId !== "N/A");
    const requiredFixtures = fixtureIds
      .map((fixtureId) => (fixturesDoc.fixtures ?? []).find((fixture: any) => fixture.fixture_id === fixtureId))
      .filter(Boolean);
    const missingExecutableFixture = requiredFixtures.some((fixture: any) => fixture.status !== "executable");
    const hasBlockingBlocker = blockers.some((blocker: any) => blocker.severity !== "P2" && blocker.status !== "closed");
    const hasUnlinked = nodeLinks.some((link: any) => link.status !== "linked");
    const status = hasBlockingBlocker || missingExecutableFixture || hasUnlinked ? "blocked" : "ready";
    statusRecords.push({
      schema: "atelier.dag-status/v1",
      dag_node_id: node.dag_node_id,
      status,
      completed_packet_ids: [],
      blocker_ids: blockers.map((blocker: any) => blocker.blocker_id),
      evidence_ids: [],
      updated_at: "2026-06-04T00:00:00Z"
    });
    profiles.push({
      schema: "atelier.validation-profile/v1",
      profile_id: `VP-${node.dag_node_id}`,
      dag_node_id: node.dag_node_id,
      global_guards: ["bun run validate:graph", "bun run validate:coverage"],
      packet_gates: gateIds,
      test_commands: gateIds
        .map((gateId) => (gatesDoc.records ?? []).find((gate: any) => gate.gate_id === gateId)?.command)
        .filter((command: string | undefined) => command && !command.includes("pending"))
        .slice(0, 8),
      evidence_required: gateIds.map((gateId) => `state/evidence/${node.dag_node_id}-${gateId}.json`),
      skip_global_checks_reason: "Packet work uses this bounded profile; global checks remain mother-agent guards."
    });
  }
  const statusByDag = new Map(statusRecords.map((record) => [record.dag_node_id, record]));
  for (const node of dag.nodes ?? []) {
    const record = statusByDag.get(node.dag_node_id);
    if (!record) continue;
    const incompleteDeps = (node.depends_on ?? []).filter((dep: string) => !isDagDependencySatisfied(statusByDag.get(dep)?.status));
    if (incompleteDeps.length > 0) {
      record.status = "blocked";
      record.blocker_ids = unique([...toStringArray(record.blocker_ids), ...incompleteDeps.map((dep: string) => `dependency:${dep}`)]);
    }
  }
  await writeYaml(path.join(STATE, "dag-status.yaml"), {
    schema: "atelier.dag-status-list/v1",
    generated_at: "2026-06-04T00:00:00Z",
    records: statusRecords
  });
  await writeNdjson(path.join(STATE, "packet-lifecycle.jsonl"), []);
  await writeYaml(path.join(CANONICAL, "validation-profiles.yaml"), {
    schema: "atelier.validation-profiles/v1",
    generated_at: "2026-06-04T00:00:00Z",
    profiles
  });
}

async function normalizePackets(warnings: string[]) {
  const packetDir = path.join(STATE, "packets");
  if (!existsSync(packetDir)) {
    warnings.push("packet directory missing");
    return;
  }
  for (const file of (await listFiles(packetDir)).filter((entry) => entry.endsWith(".yaml"))) {
    const packet = await readYaml(file);
    if (path.basename(file) === "in-flight.yaml") {
      if (packet.schema !== "atelier.in-flight-packets/v1") {
        const { allowed_files: _allowedFiles, legacy_source_path: _legacySourcePath, normalized_at: _normalizedAt, ...rest } = packet;
        await writeYaml(file, { ...rest, schema: "atelier.in-flight-packets/v1" });
      }
      continue;
    }
    if (packet.schema === "atelier.packet/v1") continue;
    if (packet.schema === "atelier.legacy-packet/v1") {
      const stableNormalizedAt = packet.recorded_at ?? "2026-06-04T00:00:00Z";
      if (packet.normalized_at !== stableNormalizedAt) await writeYaml(file, { ...packet, normalized_at: stableNormalizedAt });
      continue;
    }
    const normalized = {
      ...packet,
      schema: "atelier.legacy-packet/v1",
      normalized_at: packet.recorded_at ?? "2026-06-04T00:00:00Z",
      legacy_source_path: slash(path.relative(ROOT, file)),
      allowed_files: normalizeAllowedFiles(packet.allowed_files)
    };
    await writeYaml(file, normalized);
  }
}

async function promoteEvidence(manifestFiles: Array<Record<string, unknown>>) {
  const validationDir = path.join(STATE, "validations");
  if (!existsSync(validationDir)) return;
  await mkdir(path.join(STATE, "evidence"), { recursive: true });
  const files = (await listFiles(validationDir)).filter((file) => file.endsWith(".md"));
  for (const file of files) {
    const rel = slash(path.relative(ROOT, file));
    const bodyRef = `state/legacy/original-state/${slash(path.relative(STATE, file))}`;
    const evidence = {
      schema: "atelier.evidence/v1",
      evidence_id: `EVD-${shortHash(rel)}`,
      gate_id: inferGateId(path.basename(file)),
      status: inferEvidenceStatus(await readFile(file, "utf8")),
      body_ref: bodyRef,
      created_at: "2026-06-04T00:00:00Z"
    };
    await writeJson(path.join(STATE, "evidence", `${evidence.evidence_id}.json`), evidence);
    manifestFiles.push({ path: rel, status: "evidence-record-created", evidence_id: evidence.evidence_id });
  }
}

async function promoteLedger(warnings: string[]) {
  const ledgerDoc = firstExistingPath([path.join(ROOT, "IMPLEMENTATION_LEDGER.md"), path.join(STATE, "legacy/root-docs/IMPLEMENTATION_LEDGER.md")]);
  const events = [];
  if (existsSync(ledgerDoc)) {
    const lines = splitLines(await readFile(ledgerDoc, "utf8"));
    for (const [index, line] of lines.entries()) {
      if (/^\s*[-*]\s+/.test(line) || /^#+\s+/.test(line)) {
        events.push({
          schema: "atelier.ledger-event/v1",
          event_id: `LED-${shortHash(`IMPLEMENTATION_LEDGER.md:${index}:${line}`)}`,
          event_type: "migration_performed",
          created_at: "2026-06-04T00:00:00Z",
          subject_id: "IMPLEMENTATION_LEDGER.md",
          refs: ["state/legacy/root-docs/IMPLEMENTATION_LEDGER.md"],
          notes: line.replace(/^\s*[-*#]+\s*/, "").trim()
        });
      }
    }
  } else {
    warnings.push("IMPLEMENTATION_LEDGER.md missing; no deterministic ledger entries promoted");
  }
  events.push({
    schema: "atelier.ledger-event/v1",
    event_id: `LED-${shortHash(`migration:${new Date().toISOString()}`)}`,
    event_type: "migration_performed",
    created_at: new Date().toISOString(),
    subject_id: "@atelier/implementation-control",
    refs: ["state/legacy/manifest.json", "canonical/dag.yaml", "canonical/gates.yaml", "canonical/fixtures.yaml"],
    notes: "Migrated legacy implementation-control pack into canonical records."
  });
  await writeNdjson(path.join(STATE, "ledger.jsonl"), events);
}

async function buildQueryResult(dagId: string) {
  const dag = await readYaml(path.join(CANONICAL, "dag.yaml"));
  const node = (dag.nodes ?? []).find((item: any) => item.dag_node_id === dagId);
  if (!node) throw new Error(`Unknown DAG node: ${dagId}`);
  const gatesDoc = await readYaml(path.join(CANONICAL, "gates.yaml"));
  const fixturesDoc = await readYaml(path.join(CANONICAL, "fixtures.yaml"));
  const sections = existsSync(path.join(CANONICAL, "spec-sections.ndjson")) ? await readNdjson(path.join(CANONICAL, "spec-sections.ndjson")) : [];
  const assertions = existsSync(path.join(CANONICAL, "assertions.ndjson")) ? await readNdjson(path.join(CANONICAL, "assertions.ndjson")) : [];
  const links = (await readNdjson(path.join(CANONICAL, "assertion-links.ndjson"))).filter((link: any) => link.dag_node_id === dagId);
  const linkedAssertionIds = new Set(links.map((link: any) => link.assertion_id).filter(Boolean));
  const queryAssertions = assertions.filter((assertion: any) => linkedAssertionIds.has(assertion.assertion_id));
  for (const link of links) {
    if (!link.assertion_id && link.legacy_assertion_text) {
      queryAssertions.push({
        assertion_id: `LEGACY-${shortHash(link.link_id)}`,
        text: link.legacy_assertion_text,
        modality: "must",
        severity: severityFromGates(link.gate_ids, gatesDoc.records),
        testability: testabilityFromLink(link),
        source_section_id: link.source_section_id ?? resolveLegacySectionId(link, sections)
      });
    }
  }
  const sourceSectionIds = new Set(queryAssertions.map((assertion: any) => assertion.source_section_id).filter(Boolean));
  for (const link of links) {
    const resolved = resolveLegacySectionId(link, sections);
    if (resolved) sourceSectionIds.add(resolved);
  }
  const gateIds = new Set([...(node.required_gate_ids ?? []), ...links.flatMap((link: any) => link.gate_ids ?? [])]);
  const fixtureIds = new Set(links.flatMap((link: any) => link.fixture_ids ?? []).filter((id: string) => id !== "N/A"));
  const gates = (gatesDoc.records ?? []).filter((gate: any) => gateIds.has(gate.gate_id)).map((gate: any) => ({
    gate_id: gate.gate_id,
    purpose: gate.purpose,
    fixture_id: gate.fixture_id,
    executable_now: gate.executable_now,
    blocking_severity: gate.blocking_severity,
    proof_artifact: gate.proof_artifact,
    command: gate.command,
    negative_cases: gate.negative_cases
  }));
  const fixtures = (fixturesDoc.fixtures ?? []).filter((fixture: any) => fixtureIds.has(fixture.fixture_id) || gateIds.has(fixture.gate_id)).map((fixture: any) => ({
    fixture_id: fixture.fixture_id,
    gate_id: fixture.gate_id,
    status: fixture.status,
    command_file: fixture.command_file
  }));
  return {
    schema: "atelier.ic-query-result/v1",
    dag_node_id: dagId,
    title: node.title,
    depends_on: node.depends_on,
    assertions: queryAssertions,
    source_sections: sections.filter((section: any) => sourceSectionIds.has(section.section_id)),
    gates,
    fixtures,
    allowed_files: normalizeAllowedFiles(node.allowed_file_globs),
    forbidden_files: ["harness/knowledge/product-specs/atelier/**", "product/apps/atelier/**/implementation-control*"],
    blockers: await readBlockersForDag(dagId),
    evidence_refs: gates.map((gate: any) => gate.proof_artifact).filter(Boolean),
    recommended_next_commands: [
      `bun run query -- --dag ${dagId} --format md`,
      `bun run packet -- --dag ${dagId} --format md`,
      "bun run validate"
    ]
  };
}

function renderQueryMd(result: any) {
  return `# Query: ${result.dag_node_id}

## DAG Node

- title: ${result.title}
- depends_on: ${result.depends_on.join(", ") || "none"}

## Linked Assertions

${result.assertions.map((assertion: any) => `- ${assertion.assertion_id}: ${assertion.text}`).join("\n") || "- none"}

## Source Section Refs

${result.source_sections.map((section: any) => `- ${section.section_id}: ${section.source_path}:${section.start_line}-${section.end_line} (${section.heading_path.join(" > ")})`).join("\n") || "- none"}

## Required Gates

${result.gates.map((gate: any) => `- ${gate.gate_id} (${gate.blocking_severity}, executable=${gate.executable_now}): ${gate.purpose}`).join("\n") || "- none"}

## Required Fixtures

${result.fixtures.map((fixture: any) => `- ${fixture.fixture_id}: ${fixture.status}${fixture.command_file ? ` (${fixture.command_file})` : ""}`).join("\n") || "- none"}

## Allowed Files

${result.allowed_files.map((file: string) => `- ${file}`).join("\n") || "- none"}

## Forbidden Files

${result.forbidden_files.map((file: string) => `- ${file}`).join("\n") || "- none"}

## Blockers

${result.blockers.map((blocker: any) => `- ${blocker.blocker_id} (${blocker.severity}, ${blocker.status})`).join("\n") || "- none"}

## Evidence Refs

${result.evidence_refs.map((ref: string) => `- ${ref}`).join("\n") || "- none"}

## Recommended Next Commands

${result.recommended_next_commands.map((command: string) => `- \`${command}\``).join("\n")}
`;
}

function renderPacketMd(packet: any) {
  return `# Packet: ${packet.packet_id}

Status: ${packet.status}

## Goal

${packet.goal}

## Subagent Contract

${packet.subagent_contract.map((item: string) => `- ${item}`).join("\n")}

## Non-Goals

${packet.non_goals.map((item: string) => `- ${item}`).join("\n")}

## Required Source Section Refs

${packet.required_source_sections.map((section: any) => `- ${section.section_id}: ${section.source_path}:${section.start_line}-${section.end_line}`).join("\n") || "- none"}

## Exact Source Read Commands

${packet.source_read_commands.map((command: string) => `- \`${command}\``).join("\n") || "- none"}

## Normative Assertions

${packet.assertions.map((assertion: any) => `- ${assertion.assertion_id} (${assertion.severity}, ${assertion.testability}): ${assertion.text}`).join("\n") || "- none"}

## Allowed Files

${packet.allowed_files.map((file: string) => `- ${file}`).join("\n")}

## Forbidden Files

${packet.forbidden_files.map((file: string) => `- ${file}`).join("\n")}

## Required Gates

${packet.required_gates.map((gate: string) => `- ${gate}`).join("\n") || "- none"}

## Required Fixtures

${packet.required_fixtures.map((fixture: string) => `- ${fixture}`).join("\n") || "- none"}

## TDD Requirements

${packet.required_tests.map((test: any) => `- ${test.name}
  command: ${test.test_command}
  fail_before: ${test.expected_failure_before_implementation}
  pass_after: ${test.expected_pass_after_implementation}
  negative_cases: ${test.negative_cases.join(", ") || "packet-specific negative case must be recorded"}`).join("\n") || "- none"}

## Validation Profile

- profile_id: ${packet.validation_profile.profile_id}
- global_guards: ${packet.validation_profile.global_guards.join(", ") || "none"}
- packet_gates: ${packet.validation_profile.packet_gates.join(", ") || "none"}
- test_commands: ${packet.validation_profile.test_commands.join(" ; ") || "none"}
- evidence_required: ${packet.validation_profile.evidence_required.join(", ") || "none"}

## Acceptance Criteria

${packet.acceptance_criteria.map((item: string) => `- ${item}`).join("\n") || "- none"}

## Evidence Expectations

${packet.evidence_expectations.map((item: any) => `- ${item.gate_id}: ${item.expected_artifact}`).join("\n") || "- none"}

## Blockers

${packet.blockers.map((blocker: any) => `- ${blocker.blocker_id} (${blocker.status}, ${blocker.severity ?? "unknown"})
  source: ${blocker.source_path}
  title: ${blocker.title ?? "unknown"}
  summary: ${blocker.summary ?? "unknown"}
  affected: ${blocker.affected_dag_ids?.length ? blocker.affected_dag_ids.join(", ") : "unknown"}
  required_resolution: ${blocker.required_resolution ?? "unknown"}`).join("\n") || "- none"}

## Resume Behavior

${(packet.resume_behavior ?? []).map((item: string) => `- ${item}`).join("\n") || "- none"}

## Failure Policy

${packet.failure_policy.map((item: string) => `- ${item}`).join("\n")}
`;
}

async function ensureDirs() {
  for (const dir of [
    CANONICAL,
    path.join(STATE, "legacy/root-docs"),
    path.join(STATE, "legacy/original-state"),
    path.join(STATE, "evidence"),
    path.join(STATE, "handoffs"),
    path.join(STATE, "llm-jobs"),
    path.join(STATE, "llm-inbox"),
    VIEWS
  ]) {
    await mkdir(dir, { recursive: true });
  }
}

async function snapshotFile(source: string, target: string, kind: string, files: Array<Record<string, unknown>>) {
  await mkdir(path.dirname(target), { recursive: true });
  const snapshotExists = existsSync(target);
  if (!snapshotExists) await copyFile(source, target);
  const text = await readFile(snapshotExists ? target : source);
  const sourceStat = await stat(snapshotExists ? target : source);
  files.push({
    path: slash(path.relative(ROOT, source)),
    snapshot_path: slash(path.relative(ROOT, target)),
    kind,
    sha256: sha256(text),
    bytes: sourceStat.size,
    status: snapshotExists ? "preserved_existing_snapshot" : "preserved"
  });
}

async function validatePackets(gateIds: Set<string>, add: (level: StatusLevel, message: string) => void) {
  const packetDir = path.join(STATE, "packets");
  if (!existsSync(packetDir)) {
    add("error", "state/packets missing");
    return;
  }
  for (const file of (await listFiles(packetDir)).filter((entry) => entry.endsWith(".yaml"))) {
    try {
      const packet = await readYaml(file);
      if (path.basename(file) === "in-flight.yaml") {
        if (!packet.schema || !Array.isArray(packet.in_flight_packets)) add("error", "in-flight packet schema invalid: missing schema or in_flight_packets");
        continue;
      }
      const allowed = normalizeAllowedFiles(packet.allowed_files);
      if (allowed.length === 0) add("error", `${slash(path.relative(ROOT, file))} has missing or empty allowed_files`);
      for (const gateId of toStringArray(packet.validation_gate_ids ?? packet.required_gates)) {
        if (!gateIds.has(gateId)) add("error", `${slash(path.relative(ROOT, file))} references missing gate ${gateId}`);
      }
    } catch (error) {
      add("error", `invalid packet YAML ${slash(path.relative(ROOT, file))}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

async function validateProductSpecDrift(add: (level: StatusLevel, message: string) => void) {
  const manifestPath = path.join(CANONICAL, "product-spec-manifest.json");
  if (!existsSync(manifestPath)) return;
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    const manifestPaths = new Set<string>((manifest.files ?? []).map((file: any) => slash(file.path)));
    const currentPaths = new Set((await listFiles(PRODUCT_SPEC_ROOT))
      .filter((file) => file.endsWith(".md"))
      .map((file) => slash(path.relative(REPO_ROOT, file))));
    for (const currentPath of currentPaths) {
      if (!manifestPaths.has(currentPath)) add("error", `new product spec after manifest: ${currentPath}`);
    }
    for (const file of manifest.files ?? []) {
      const manifestPath = slash(file.path);
      const absolute = path.join(REPO_ROOT, manifestPath);
      if (!existsSync(absolute)) {
        add("error", `product spec missing after manifest: ${manifestPath}`);
        continue;
      }
      const text = await readFile(absolute, "utf8");
      if (sha256(text) !== file.sha256) add("error", `product spec drift after manifest: ${manifestPath}`);
    }
  } catch (error) {
    add("error", `invalid product-spec manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function validateLegacyManifest(add: (level: StatusLevel, message: string) => void) {
  const manifestPath = path.join(STATE, "legacy/manifest.json");
  if (!existsSync(manifestPath)) {
    add("error", "state/legacy/manifest.json missing");
    return;
  }
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    for (const file of manifest.files ?? []) {
      if (file.snapshot_path && !existsSync(path.join(ROOT, file.snapshot_path))) add("error", `legacy manifest snapshot missing: ${file.snapshot_path}`);
    }
  } catch (error) {
    add("error", `invalid legacy manifest: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function validateRenderedViews(add: (level: StatusLevel, message: string) => void) {
  const before = new Map<string, string>();
  for (const view of viewFiles) {
    const file = path.join(VIEWS, view);
    if (!existsSync(file)) {
      add("error", `generated view missing: views/${view}`);
      continue;
    }
    const text = await readFile(file, "utf8");
    if (!text.startsWith(GENERATED_HEADER)) add("error", `generated view missing header: views/${view}`);
    before.set(view, sha256(text));
  }
  const rendered = await renderViewsToStrings();
  for (const [view, body] of Object.entries(rendered)) {
    if (before.has(view) && before.get(view) !== sha256(GENERATED_HEADER + body)) add("error", `generated view stale: views/${view}`);
  }
}

async function renderViewsToStrings() {
  const gates = await readYaml(path.join(CANONICAL, "gates.yaml")).catch(() => ({ records: [] }));
  const fixtures = await readYaml(path.join(CANONICAL, "fixtures.yaml")).catch(() => ({ fixtures: [] }));
  const dag = await readYaml(path.join(CANONICAL, "dag.yaml")).catch(() => ({ nodes: [] }));
  const sections = await readNdjson(path.join(CANONICAL, "spec-sections.ndjson")).catch(() => []);
  const links = await readNdjson(path.join(CANONICAL, "assertion-links.ndjson")).catch(() => []);
  const assertions = await readNdjson(path.join(CANONICAL, "assertions.ndjson")).catch(() => []);
  const ledger = await readNdjson(path.join(STATE, "ledger.jsonl")).catch(() => []);
  const evidence = existsSync(path.join(STATE, "evidence")) ? await listFiles(path.join(STATE, "evidence")) : [];
  const packets = existsSync(path.join(STATE, "packets")) ? await listFiles(path.join(STATE, "packets")) : [];
  const blockers = existsSync(path.join(STATE, "blockers")) ? await listFiles(path.join(STATE, "blockers")) : [];
  const frontierResult = await computeFrontier().catch(() => ({ ready: [], blocked: [] }));
  const resumePlan = await computeResumePlan().catch(() => null);
  const cleanup = await computeCleanupPlan().catch(() => ({ items: [] }));
  const graphData = await buildGraphData().catch(() => ({ nodes: [], edges: [] }));
  const mmd = renderMermaidGraph(graphData);
  return {
    "README.md": `# Implementation-Control Views

These files are generated views. Source of truth lives in \`canonical/**\` and \`state/**\`.

Run from this directory:

\`\`\`bash
bun run doctor
bun run resume
bun run frontier
bun run packet -- --dag <DAG-ID> --format md
bun run validate:fixtures -- --summary
bun run validate
\`\`\`
`,
    "OPERATING_KERNEL.md": `# Operating Kernel

You are the implementation coordinator.

Do not read all product specs.
Do not read all implementation-control docs.
Do not dispatch implementation work from broad Markdown context.

Long-run loop:

\`\`\`bash
bun run resume
bun run frontier
bun run packet -- --dag <DAG-ID> --format md --out state/packets/generated/<id>.yaml
bun run validate:packet -- --packet state/packets/generated/<id>.yaml
bun run validate:tests -- --packet state/packets/generated/<id>.yaml
bun run validate:fixtures -- --summary
bun run render
bun run validate
\`\`\`

Rules:
- Product specs are immutable.
- \`canonical/**\` and \`state/**\` are source of truth.
- \`views/**\` are generated and must not be edited directly.
- Dispatch only packet context plus \`views/SUBAGENT_CONTRACT.md\`.
- Validate packet-specific gates before global claims.
- Use fixture summary validation by default; run detailed fixture validation only when repairing fixture blockers.
- Record evidence and handoff state before moving frontier.
- Do not read broad docs unless audit mode explicitly requires it.
- If scripts and Markdown disagree, trust canonical records and fix rendered views.
- If Bun is unavailable, do not claim validation passed; report static inspection only.

Current index summary:
- DAG nodes: ${dag.nodes.length}
- Product spec sections: ${sections.length}
- Assertions: ${assertions.length}
- Gates: ${gates.records.length}
- Fixtures: ${fixtures.fixtures.length}
- Frontier ready: ${frontierResult.ready.length}
- Frontier blocked: ${frontierResult.blocked.length}
`,
    "IMPLEMENTATION_DAG.md": `# Implementation DAG

| DAG node | Phase | Owner | Required gates | Allowed files |
| --- | --- | --- | --- | --- |
${dag.nodes.map((node: any) => `| ${node.dag_node_id} | ${escapeCell(node.phase)} | ${escapeCell(node.owner_role)} | ${node.required_gate_ids.join(", ")} | ${escapeCell(node.allowed_file_globs.join(", "))} |`).join("\n")}
`,
    "IMPLEMENTATION_GRAPH.md": `# Implementation Graph

Graph artifacts:
- \`views/IMPLEMENTATION_GRAPH.mmd\`
- \`state/graph/implementation-graph.json\`

## Summary

- nodes: ${graphData.nodes.length}
- edges: ${graphData.edges.length}
- ready frontier: ${frontierResult.ready.length}
- blocked nodes: ${frontierResult.blocked.length}

Current frontier:

${frontierResult.ready.map((node: any) => `- ready: ${node.dag_node_id} ${node.title}`).join("\n") || "- no ready nodes"}

Blocked nodes:

${frontierResult.blocked.slice(0, 20).map((node: any) => `- blocked: ${node.dag_node_id} ${node.required_repairs.join("; ")}`).join("\n") || "- none"}

## Mermaid

\`\`\`mermaid
${mmd}
\`\`\`
`,
    "CONTRACT_TO_BUILD_MATRIX.md": `# Contract To Build Matrix

| Link | DAG node | Status | Gates | Fixtures | Provenance |
| --- | --- | --- | --- | --- | --- |
${links.map((link: any) => `| ${link.link_id} | ${link.dag_node_id} | ${link.status} | ${(link.gate_ids ?? []).join(", ")} | ${(link.fixture_ids ?? []).join(", ")} | ${escapeCell(link.provenance)} |`).join("\n")}
`,
    "VALIDATION_GATE_REGISTRY.md": `# Validation Gate Registry

| Gate | Severity | Executable | Fixture | Purpose |
| --- | --- | --- | --- | --- |
${gates.records.map((gate: any) => `| ${gate.gate_id} | ${gate.blocking_severity} | ${gate.executable_now ? "yes" : "no"} | ${gate.fixture_id} | ${escapeCell(gate.purpose)} |`).join("\n")}
`,
    "SPEC_READ_PLAN.md": `# Spec Read Plan

Do not read all product specs.

Use:

\`\`\`bash
bun run query -- --dag <DAG-ID> --format md
bun run packet -- --dag <DAG-ID> --format md
\`\`\`

Packets include exact source refs and \`sed -n '<start>,<end>p' <source_path>\` commands.
The full section index is machine data in \`canonical/spec-sections.ndjson\` (${sections.length} sections).
If a packet lacks needed context, report a control-index defect instead of broad spec exploration.
`,
    "IMPLEMENTATION_LEDGER.md": `# Implementation Ledger

| Area | Count |
| --- | ---: |
| Ledger events | ${ledger.length} |
| Packets | ${packets.filter((file) => file.endsWith(".yaml")).length} |
| Evidence records | ${evidence.filter((file) => file.endsWith(".json")).length} |
| Blockers | ${blockers.filter((file) => file.endsWith(".md")).length} |
`,
    "SUBAGENT_CONTRACT.md": `# Subagent Contract

${subagentContractRules().map((rule) => `- ${rule}`).join("\n")}

Handoff must include:
- files changed
- tests written first
- commands run
- evidence paths
- blockers or missing context
`,
    "RESUME_PROTOCOL.md": `# Resume Protocol

Use \`bun run resume\` after LLM usage limits, compacted context, interrupted subagents, failed validation, blocked packets, or stale views.

Current recovery snapshot:

- active packets: ${resumePlan?.current_state.active_packets.join(", ") || "none"}
- blocked packets: ${resumePlan?.current_state.blocked_packets.join(", ") || "none"}
- completed DAG nodes: ${resumePlan?.current_state.completed_dag_nodes.join(", ") || "none"}
- next frontier: ${resumePlan?.current_state.next_frontier.join(", ") || "none"}

Next commands:

${(resumePlan?.next_commands ?? ["bun run resume"]).map((command: string) => `- \`${command}\``).join("\n")}
`,
    "CLEANUP_PLAN.md": `# Cleanup Plan

Run:

\`\`\`bash
bun run cleanup:plan
bun run cleanup:apply -- --yes
\`\`\`

Current classifications:

${cleanup.items.slice(0, 80).map((item: any) => `- ${item.classification}: ${item.path}`).join("\n")}
`
  };
}

async function writeView(file: string, body: string) {
  await writeFile(path.join(VIEWS, file), GENERATED_HEADER + body);
}

async function appendLedger(eventType: string, subjectId: string, refs: string[], notes: string) {
  const file = path.join(STATE, "ledger.jsonl");
  const existing = existsSync(file) ? await readFile(file, "utf8") : "";
  const event = {
    schema: "atelier.ledger-event/v1",
    event_id: `LED-${shortHash(`${eventType}:${subjectId}:${refs.join(",")}:${notes}`)}`,
    event_type: eventType,
    created_at: new Date().toISOString(),
    subject_id: subjectId,
    refs,
    notes
  };
  if (!existing.includes(event.event_id)) await writeFile(file, `${existing}${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${JSON.stringify(event)}\n`);
}

async function appendPacketLifecycle(eventType: string, packetId: string, dagId: string, status: string, reasons: string[]) {
  const file = path.join(STATE, "packet-lifecycle.jsonl");
  await mkdir(path.dirname(file), { recursive: true });
  const existing = existsSync(file) ? await readFile(file, "utf8") : "";
  const event = {
    schema: "atelier.packet-lifecycle-event/v1",
    event_id: `PLE-${shortHash(`${eventType}:${packetId}:${dagId}:${status}`)}`,
    event_type: eventType,
    created_at: new Date().toISOString(),
    packet_id: packetId,
    dag_node_id: dagId,
    status,
    reasons
  };
  if (!existing.includes(event.event_id)) await writeFile(file, `${existing}${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${JSON.stringify(event)}\n`);
}

function assertionJob(jobId: string, section: any, text: string) {
  return `# LLM Job: Extract Normative Assertions

## Job Metadata

job_id: ${jobId}
kind: assertions
source_section_id: ${section.section_id}
source_path: ${section.source_path}
heading_path: ${section.heading_path.join(" > ")}
output_format: jsonl

## Input Section

\`\`\`markdown
${text}
\`\`\`

## Output Contract

Return JSONL only. No prose. No Markdown fences.

Each line must match:

{
  "source_section_id": "string",
  "text": "string",
  "modality": "must | must_not | should | invariant | definition",
  "domain": "graph | verification | event | adapter | surface | hpo | run | write_authority | product | positioning | roadmap | other",
  "testability": "executable | oracle_gap | semantic_review | non_goal",
  "severity": "P0 | P1 | P2",
  "closed_terms": ["string"],
  "ambiguity_status": "clear | ambiguous | conflicting",
  "notes": "string"
}

Rules:
- Extract only normative, testable, definitional, or invariant statements.
- Do not summarize the whole section.
- Do not invent requirements.
- Preserve source meaning.
- Prefer smaller atomic assertions over broad compound assertions.
- If the section has no normative content, return no lines.
`;
}

function genericJob(kind: string, jobId: string, section: any, text: string) {
  return `# LLM Job: ${kind}

job_id: ${jobId}
kind: ${kind}
source_section_id: ${section.section_id}
source_path: ${section.source_path}
heading_path: ${section.heading_path.join(" > ")}

## Input Section

\`\`\`markdown
${text}
\`\`\`

## Output Contract

Return JSON only. Preserve source meaning and do not invent requirements.
`;
}

async function readTextRef(ref: any) {
  const file = path.join(REPO_ROOT, ref.path);
  return splitLines(await readFile(file, "utf8")).slice(ref.start_line - 1, ref.end_line).join("\n");
}

function subagentContractRules() {
  return [
    "Read only this packet and exact source line ranges named here.",
    "Do not read legacy root docs or broad product-spec files.",
    "Do not edit product specs.",
    "Write or update tests before implementation.",
    "Edit only allowed files.",
    "Run only this packet validation profile unless the mother agent requests a global guard.",
    "Record evidence for tests, implementation, and validation.",
    "If context is insufficient, stop and return a blocker instead of exploring unrelated Markdown.",
    "Return a structured handoff with files changed, tests written, commands run, evidence paths, and blockers."
  ];
}

async function validationProfileForDag(dagId: string) {
  const profilesPath = path.join(CANONICAL, "validation-profiles.yaml");
  if (!existsSync(profilesPath)) {
    return {
      profile_id: `VP-${dagId}`,
      global_guards: ["bun run validate:graph", "bun run validate:coverage"],
      packet_gates: [],
      test_commands: [],
      evidence_required: [],
      skip_global_checks_reason: "Validation profiles missing; generated fallback profile is not dispatchable."
    };
  }
  const doc = await readYaml(profilesPath);
  const profile = (doc.profiles ?? []).find((item: any) => item.dag_node_id === dagId);
  if (!profile) throw new Error(`Missing validation profile for ${dagId}`);
  return {
    profile_id: profile.profile_id,
    global_guards: profile.global_guards ?? [],
    packet_gates: profile.packet_gates ?? [],
    test_commands: profile.test_commands ?? [],
    evidence_required: profile.evidence_required ?? [],
    skip_global_checks_reason: profile.skip_global_checks_reason
  };
}

async function readDagStatuses() {
  const statusPath = path.join(STATE, "dag-status.yaml");
  const map = new Map<string, any>();
  if (!existsSync(statusPath)) return map;
  const doc = await readYaml(statusPath);
  for (const record of doc.records ?? []) map.set(record.dag_node_id, record);
  return map;
}

async function dispatchBlockersForDag(dagId: string) {
  return (await readBlockersForDag(dagId)).filter((blocker: any) => blocker.status !== "closed" && blocker.severity !== "P2");
}

async function assessDispatchability(node: any) {
  const reasons = [];
  const links = existsSync(path.join(CANONICAL, "assertion-links.ndjson")) ? await readNdjson(path.join(CANONICAL, "assertion-links.ndjson")) : [];
  const fixtures = existsSync(path.join(CANONICAL, "fixtures.yaml")) ? await readYaml(path.join(CANONICAL, "fixtures.yaml")) : { fixtures: [] };
  const sections = existsSync(path.join(CANONICAL, "spec-sections.ndjson")) ? await readNdjson(path.join(CANONICAL, "spec-sections.ndjson")) : [];
  const gates = existsSync(path.join(CANONICAL, "gates.yaml")) ? await readYaml(path.join(CANONICAL, "gates.yaml")) : { records: [] };
  const nodeLinks = links.filter((link: any) => link.dag_node_id === node.dag_node_id);
  if ((node.allowed_file_globs ?? []).length === 0) reasons.push("allowed files are empty");
  if ((node.owns_assertion_ids ?? []).length === 0) reasons.push("node owns no normalized assertions");
  for (const link of nodeLinks) {
    if (link.status !== "linked") reasons.push(`link ${link.link_id} is ${link.status}`);
    if (!link.assertion_id) reasons.push(`link ${link.link_id} has no assertion_id`);
    if (!link.source_section_id || !sections.some((section: any) => section.section_id === link.source_section_id)) reasons.push(`link ${link.link_id} has unresolved source section`);
    for (const gateId of link.gate_ids ?? []) if (!(gates.records ?? []).some((gate: any) => gate.gate_id === gateId)) reasons.push(`missing gate ${gateId}`);
    for (const fixtureId of link.fixture_ids ?? []) {
      if (fixtureId === "N/A") continue;
      const fixture = (fixtures.fixtures ?? []).find((item: any) => item.fixture_id === fixtureId);
      if (!fixture) reasons.push(`missing fixture ${fixtureId}`);
      else if (fixture.status !== "executable") reasons.push(`fixture ${fixtureId} is ${fixture.status}`);
    }
  }
  const profile = existsSync(path.join(CANONICAL, "validation-profiles.yaml")) ? await validationProfileForDag(node.dag_node_id).catch(() => null) : null;
  if (!profile) reasons.push("packet-specific validation profile missing");
  return {
    ready: reasons.length === 0,
    reasons
  };
}

function findCycles(nodes: any[]) {
  const byId = new Map(nodes.map((node) => [node.dag_node_id, node]));
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string, pathSoFar: string[]) {
    if (visiting.has(id)) {
      cycles.push([...pathSoFar, id]);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const node = byId.get(id);
    for (const dep of node?.depends_on ?? []) visit(dep, [...pathSoFar, id]);
    visiting.delete(id);
    visited.add(id);
  }
  for (const node of nodes) visit(node.dag_node_id, []);
  return cycles;
}

async function readPacketFromPath(packetPath: string) {
  const text = await readFile(packetPath, "utf8");
  if (packetPath.endsWith(".json")) return JSON.parse(text);
  const parsed = YAML.parse(text);
  if (parsed && typeof parsed === "object") return parsed;
  throw new Error(`Cannot parse packet file: ${packetPath}`);
}

async function referencedPaths() {
  const refs = new Set<string>();
  for (const file of [
    path.join(CANONICAL, "assertion-links.ndjson"),
    path.join(STATE, "ledger.jsonl")
  ]) {
    if (!existsSync(file)) continue;
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/(?:state|views|canonical|archive)\/[A-Za-z0-9_./@*-]+/g)) refs.add(match[0]);
  }
  return refs;
}

async function writeRootReadme() {
  await writeFile(path.join(ROOT, "README.md"), `# Atelier Implementation Control

This root is a thin entrypoint. Machine-queryable truth lives in \`canonical/**\` and \`state/**\`.
Generated human views live in \`views/**\`.

Start here:

\`\`\`bash
bun run resume
bun run frontier
bun run packet -- --dag <DAG-ID> --format md
\`\`\`

Do not read legacy root docs during ordinary implementation. Legacy material is archived under \`state/legacy/**\` or \`archive/**\`.
`);
}

function mermaidId(value: string) {
  return value.replace(/[^A-Za-z0-9_]/g, "_");
}

function isDagDependencySatisfied(status: unknown) {
  return COMPLETED_DAG_STATUSES.has(String(status ?? ""));
}

function stableGraphData(graphData: any) {
  return {
    nodes: (graphData.nodes ?? []).map((node: any) => ({
      dag_node_id: node.dag_node_id,
      title: node.title,
      status: node.status,
      blockers: [...(node.blockers ?? [])].sort(),
      required_gates: [...(node.required_gates ?? [])].sort(),
      packet_links: [...(node.packet_links ?? [])].sort(),
      evidence_links: [...(node.evidence_links ?? [])].sort()
    })).sort((left: any, right: any) => left.dag_node_id.localeCompare(right.dag_node_id)),
    edges: (graphData.edges ?? []).map((edge: any) => ({
      from: edge.from,
      to: edge.to
    })).sort((left: any, right: any) => `${left.from}->${left.to}`.localeCompare(`${right.from}->${right.to}`))
  };
}

function firstExistingPath(paths: string[]) {
  return paths.find((candidate) => existsSync(candidate)) ?? paths[0];
}

function normalizeLegacyControlPath(value: string | null) {
  if (!value) return null;
  const prefix = "harness/knowledge/implementation-control/atelier/";
  if (!value.startsWith(prefix)) return value;
  const tail = value.slice(prefix.length);
  if (!rootMarkdownDocs.includes(tail)) return value;
  return `${prefix}state/legacy/root-docs/${tail}`;
}

async function readBlockersForDag(dagId: string) {
  const dir = path.join(STATE, "blockers");
  if (!existsSync(dir)) return [];
  const blockers = [];
  for (const file of (await listFiles(dir)).filter((entry) => entry.endsWith(".md"))) {
    const text = await readFile(file, "utf8");
    const metadata = extractBlockerMetadata(text);
    const affectedDagIds = expandDagRefs(toStringArray(metadata.affected_dag_nodes ?? metadata.affected_dag_ids));
    const mentionsDag = affectedDagIds.length === 0 && text.includes(dagId);
    if (affectedDagIds.includes(dagId) || mentionsDag) {
      blockers.push({
        blocker_id: String(metadata.blocker_id ?? metadata.id ?? path.basename(file, ".md")),
        status: normalizeBlockerStatus(metadata.status),
        severity: normalizeBlockerSeverity(metadata.severity),
        title: String(metadata.title ?? firstMarkdownHeading(text) ?? ""),
        summary: nullableString(metadata.description) ?? firstMetadataSummary(text),
        source_path: slash(path.relative(ROOT, file)),
        affected_dag_ids: affectedDagIds.length > 0 ? affectedDagIds : undefined,
        required_resolution: nullableString(metadata.required_resolution ?? metadata.resolution_note ?? metadata.partial_resolution_note ?? metadata.note) ?? undefined
      });
    }
  }
  return blockers;
}

function extractBlockerMetadata(text: string): Record<string, unknown> {
  const frontmatter = parseYamlFrontmatter(text);
  if (frontmatter) return frontmatter;
  const fencedYaml = parseFirstFencedYaml(text);
  const lineMetadata = parseMarkdownMetadataLines(text);
  const tableMetadata = parseMarkdownMetadataTable(text);
  return { ...tableMetadata, ...lineMetadata, ...fencedYaml };
}

function parseYamlFrontmatter(text: string): Record<string, unknown> | null {
  const match = /^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/.exec(text);
  if (!match) return null;
  return parseYamlMetadata(match[1]);
}

function parseFirstFencedYaml(text: string): Record<string, unknown> {
  const match = /```ya?ml\s*\n([\s\S]*?)\n```/i.exec(text);
  return match ? parseYamlMetadata(match[1]) ?? {} : {};
}

function parseYamlMetadata(source: string): Record<string, unknown> | null {
  try {
    const parsed = YAML.parse(source);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function parseMarkdownMetadataLines(text: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (const line of splitLines(stripFencedBlocks(text))) {
    const match = /^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.+?)\s*$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    if (["id", "blocker_id", "status", "severity", "title", "summary", "required_resolution"].includes(key)) {
      metadata[key] = match[2];
    }
  }
  return metadata;
}

function parseMarkdownMetadataTable(text: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  for (const line of splitLines(stripFencedBlocks(text))) {
    const cells = line.split("|").map((cell) => cell.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    const key = cells[0].toLowerCase().replace(/\s+/g, "_");
    if (["id", "blocker_id", "status", "severity", "title", "summary", "required_resolution"].includes(key)) {
      metadata[key] = cells[1];
    }
  }
  return metadata;
}

function normalizeBlockerStatus(value: unknown): BlockerStatus {
  const status = String(value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (["open", "active", "blocked", "unresolved"].includes(status)) return "open";
  if (status === "partial" || status.startsWith("partial_") || status === "partially_closed") return "partial";
  if (["closed", "resolved", "done"].includes(status)) return "closed";
  return "unknown";
}

function normalizeBlockerSeverity(value: unknown): BlockerSeverity {
  const severity = String(value ?? "").trim().toUpperCase();
  return severity === "P0" || severity === "P1" || severity === "P2" ? severity : "unknown";
}

function expandDagRefs(values: string[]) {
  const ids = new Set<string>();
  for (const value of values) {
    const range = /DAG-(\d+)[A-Z]?\s*(?:to|\.\.)\s*DAG-(\d+)[A-Z]?/i.exec(value);
    if (range) {
      const start = Number(range[1]);
      const end = Number(range[2]);
      for (let current = Math.min(start, end); current <= Math.max(start, end); current += 1) {
        ids.add(`DAG-${String(current).padStart(2, "0")}`);
      }
    }
    for (const match of value.matchAll(/DAG-\d+[A-Z]?/gi)) {
      ids.add(match[0].toUpperCase());
    }
  }
  return [...ids].sort();
}

function stripFencedBlocks(text: string) {
  return text.replace(/```[\s\S]*?```/g, "");
}

function firstMarkdownHeading(text: string) {
  return splitLines(text).map((line) => /^#\s+(.+?)\s*$/.exec(line)?.[1]).find(Boolean);
}

function firstMetadataSummary(text: string) {
  const cleaned = stripFencedBlocks(text);
  return splitLines(cleaned)
    .map((line) => line.trim())
    .find((line) => line.length > 0 && !line.startsWith("#") && !line.includes("|"));
}

function resolveLegacySectionId(link: any, sections: any[]) {
  return resolveAllLegacySectionIds(link, sections)[0];
}

function resolveAllLegacySectionIds(link: any, sections: any[]) {
  const refs = toStringArray(link.legacy_source_sections);
  const resolved: string[] = [];
  for (const ref of refs) {
    const [refPath, refHash] = ref.split("#");
    const normalizedPath = refPath.startsWith("harness/") ? refPath : "";
    const candidates = sections.filter((section: any) => section.source_path === normalizedPath);
    if (refHash) {
      const slug = slugify(refHash);
      const match = candidates.find((section: any) => section.heading_slug === slug || section.heading_slug.endsWith(slug));
      if (match) {
        resolved.push(match.section_id);
        continue;
      }
    }
    if (candidates[0]) resolved.push(candidates[0].section_id);
  }
  return unique(resolved);
}

function parseHeadings(lines: string[]) {
  return lines.map((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) return null;
    return { level: match[1].length, title: match[2].replace(/\s+#+$/, ""), line: index + 1 };
  }).filter(Boolean) as Array<{ level: number; title: string; line: number }>;
}

function markdownHeadingRecords(text: string, fallbackPrefix: string) {
  const lines = splitLines(text);
  const headings = parseHeadings(lines).filter((heading) => heading.level <= 3);
  const ranges = buildSectionRanges(lines, headings);
  return ranges.map((range, index) => {
    const title = range.headingPath[range.headingPath.length - 1] ?? `${fallbackPrefix}-${index + 1}`;
    const body = lines.slice(range.startLine - 1, range.endLine).join("\n");
    const summary = body.split(/\r?\n/).map((line) => line.trim()).find((line) => line.length > 0 && !line.startsWith("#")) ?? "";
    return {
      title,
      slug: slugify(`${fallbackPrefix}-${title}`) || `${fallbackPrefix}-${index + 1}`,
      start_line: range.startLine,
      end_line: range.endLine,
      summary,
      body
    };
  });
}

function extractListAfterLabels(text: string, labels: string[]) {
  const matches = new Set<string>();
  for (const line of splitLines(text)) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();
    if (!labels.some((label) => lower.includes(label))) continue;
    for (const token of trimmed.match(/[A-Za-z0-9_./*{}@-]+/g) ?? []) {
      if (token.includes("/") || token.includes("*")) matches.add(token.replace(/[.,;:]$/, ""));
    }
  }
  return [...matches].sort();
}

function buildSectionRanges(lines: string[], headings: Array<{ level: number; title: string; line: number }>) {
  if (headings.length === 0) return [{ headingPath: [], startLine: 1, endLine: Math.max(lines.length, 1) }];
  const ranges = [];
  const stack: Array<{ level: number; title: string }> = [];
  for (let i = 0; i < headings.length; i += 1) {
    const heading = headings[i];
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) stack.pop();
    stack.push({ level: heading.level, title: heading.title });
    const next = headings.slice(i + 1).find((candidate) => candidate.level <= heading.level);
    ranges.push({
      headingPath: stack.map((item) => item.title),
      startLine: heading.line,
      endLine: next ? next.line - 1 : lines.length
    });
  }
  return ranges;
}

async function listFiles(root: string, options: { skip?: string[] } = {}) {
  const entries: string[] = [];
  async function visit(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (options.skip?.includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) entries.push(full);
    }
  }
  if (existsSync(root)) await visit(root);
  return entries.sort();
}

async function resolveInputFiles(input: string) {
  const hasGlob = /[*?[\]{}]/.test(input);
  if (hasGlob) {
    const matches = (await fg(input, {
      absolute: true,
      cwd: process.cwd(),
      onlyFiles: true
    })).filter((file) => file.endsWith(".jsonl")).sort();
    if (matches.length === 0) throw new Error(`No JSONL files matched input glob: ${input}`);
    return matches;
  }
  const resolved = path.resolve(process.cwd(), input);
  if (!existsSync(resolved)) throw new Error(`Input path does not exist: ${input}`);
  const resolvedStat = statSync(resolved);
  if (resolvedStat.isFile()) return [resolved];
  if (resolvedStat.isDirectory()) {
    const matches = (await listFiles(resolved)).filter((file) => file.endsWith(".jsonl")).sort();
    if (matches.length === 0) throw new Error(`No JSONL files found under input directory: ${input}`);
    return matches;
  }
  throw new Error(`Input path is neither a file nor directory: ${input}`);
}

async function readYaml(file: string) {
  return YAML.parse(await readFile(file, "utf8"));
}

async function readYamlIfExists(file: string, add: (level: StatusLevel, message: string) => void) {
  if (!existsSync(file)) {
    add("error", `${slash(path.relative(ROOT, file))} missing`);
    return null;
  }
  try {
    return await readYaml(file);
  } catch (error) {
    add("error", `invalid YAML ${slash(path.relative(ROOT, file))}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function writeYaml(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, YAML.stringify(value, { lineWidth: 0 }));
}

async function writeJson(file: string, value: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function readNdjson(file: string) {
  const text = await readFile(file, "utf8");
  return text.split(/\r?\n/).filter((line) => line.trim().length > 0).map((line) => JSON.parse(line));
}

async function readNdjsonIfExists(file: string, add: (level: StatusLevel, message: string) => void) {
  if (!existsSync(file)) {
    add("error", `${slash(path.relative(ROOT, file))} missing`);
    return [];
  }
  try {
    return await readNdjson(file);
  } catch (error) {
    add("error", `invalid NDJSON ${slash(path.relative(ROOT, file))}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function writeNdjson(file: string, rows: unknown[]) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length > 0 ? "\n" : ""));
}

function validateArray(values: unknown[] | undefined, schema: z.ZodSchema, name: string, add: (level: StatusLevel, message: string) => void) {
  if (!Array.isArray(values)) {
    add("error", `${name} collection missing or not an array`);
    return;
  }
  for (const [index, value] of values.entries()) {
    const parsed = schema.safeParse(value);
    if (!parsed.success) add("error", `invalid ${name} at index ${index}: ${parsed.error.issues.map((issue) => issue.path.join(".") + " " + issue.message).join("; ")}`);
  }
}

function duplicateCheck(values: any[], key: string, add: (level: StatusLevel, message: string) => void, label: string) {
  const seen = new Set<string>();
  for (const value of values ?? []) {
    const id = value?.[key];
    if (!id) continue;
    if (seen.has(id)) add("error", `duplicate ${label}: ${id}`);
    seen.add(id);
  }
  return seen;
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function shortHash(value: string) {
  return sha256(value).slice(0, 10).toUpperCase();
}

function splitLines(text: string) {
  return text.replace(/\r\n/g, "\n").split("\n");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function unique(values: string[]) {
  return [...new Set(values.filter((value) => value.length > 0))];
}

function toStringArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => toStringArray(item));
  return [String(value)];
}

function normalizeAllowedFiles(value: unknown): string[] {
  if (!Array.isArray(value)) return toStringArray(value);
  return value.map((item) => typeof item === "string" ? item : String(item?.path ?? item?.glob ?? "")).filter(Boolean);
}

function normalizeSeverity(value: unknown): Severity {
  const text = String(value ?? "P2");
  if (text.includes("P0")) return "P0";
  if (text.includes("P1")) return "P1";
  return "P2";
}

function nullableString(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function firstString(values: unknown[]) {
  return values.map((value) => value === null || value === undefined ? "" : String(value)).find((value) => value.length > 0);
}

function linkStatus(row: any) {
  if (row.traceability_status === "concrete" && !row.blocker_id && (!row.deferral_state || row.deferral_state === "concrete")) return "linked";
  if (row.blocker_id) return "blocked";
  if (String(row.traceability_status ?? "").includes("oracle")) return "oracle_gap";
  if (String(row.current_contract_testability ?? "").includes("non_goal")) return "non_goal";
  if (String(row.traceability_status ?? "").includes("fixture") || String(row.deferral_state ?? "").includes("fixture")) return "blocked";
  if (String(row.deferral_state ?? "").includes("deferred")) return "deferred";
  return "blocked";
}

function assertionIdFor(sourceSectionId: string, modality: string, text: string, domain: string) {
  return `AST-${domain.toUpperCase()}-${shortHash(`${sourceSectionId}:${modality}:${normalizeText(text)}`)}`;
}

function inferAssertionDomain(row: any) {
  const haystack = [
    row.dag_node_id,
    row.source_sections,
    row.exact_assertion,
    row.owner_role,
    row.allowed_files_ref
  ].flatMap((value) => toStringArray(value)).join(" ").toLowerCase();
  if (haystack.includes("graph")) return "graph";
  if (haystack.includes("verification")) return "verification";
  if (haystack.includes("event")) return "event";
  if (haystack.includes("adapter")) return "adapter";
  if (haystack.includes("surface") || haystack.includes("cli")) return "surface";
  if (haystack.includes("hpo")) return "hpo";
  if (haystack.includes("run")) return "run";
  if (haystack.includes("write_authority") || haystack.includes("write authority")) return "write_authority";
  if (haystack.includes("positioning")) return "positioning";
  if (haystack.includes("roadmap")) return "roadmap";
  if (haystack.includes("product")) return "product";
  return "other";
}

function testabilityFromLegacyValue(value: unknown) {
  const text = String(value ?? "").toLowerCase();
  if (text.includes("oracle")) return "oracle_gap";
  if (text.includes("semantic")) return "semantic_review";
  if (text.includes("non_goal")) return "non_goal";
  return "executable";
}

function severityFromGateIds(gateIds: string[]) {
  if (gateIds.includes("VG-001") || gateIds.includes("VG-026A") || gateIds.includes("VG-036")) return "P0";
  if (gateIds.length > 0) return "P1";
  return "P2";
}

function resolveLegacySectionIdFromRefs(refs: string[], sections: any[]) {
  for (const ref of refs) {
    const [refPath, refHash] = ref.split("#");
    const normalizedPath = refPath.startsWith("harness/") ? refPath : "";
    const candidates = sections.filter((section: any) => section.source_path === normalizedPath);
    if (refHash) {
      const slug = slugify(refHash);
      const match = candidates.find((section: any) => section.heading_slug === slug || section.heading_slug.endsWith(slug));
      if (match) return match.section_id;
    }
    if (candidates[0]) return candidates[0].section_id;
  }
  return undefined;
}

function titleFromDagRows(dagNodeId: string, rows: any[]) {
  const assertion = firstString(rows.map((row) => row.exact_assertion));
  return assertion ? `${dagNodeId}: ${assertion.slice(0, 96)}` : dagNodeId;
}

function inferDependsOn(dagNodeId: string) {
  if (dagNodeId === "DAG-00") return [];
  if (dagNodeId.startsWith("DAG-01")) return ["DAG-00"];
  if (dagNodeId.startsWith("DAG-02")) return ["DAG-01"];
  return ["DAG-02"];
}

function inferGateId(fileName: string) {
  return /VG-[0-9]+[A-Z]?/.exec(fileName)?.[0];
}

function inferEvidenceStatus(text: string) {
  if (/\bpassed\b/i.test(text)) return "passed";
  if (/\bfailed\b/i.test(text)) return "failed";
  if (/\bblocked\b/i.test(text)) return "blocked";
  if (/\bnot[_ -]?run\b/i.test(text)) return "not_run";
  return "unknown";
}

function severityFromGates(gateIds: string[], gates: any[]) {
  const severities = gateIds.map((id) => gates.find((gate) => gate.gate_id === id)?.blocking_severity).filter(Boolean);
  if (severities.includes("P0")) return "P0";
  if (severities.includes("P1")) return "P1";
  return "P2";
}

function testabilityFromLink(link: any) {
  const value = String(link.legacy_testability ?? "");
  if (value.includes("oracle")) return "oracle_gap";
  if (value.includes("semantic")) return "semantic_review";
  if (value.includes("not")) return "semantic_review";
  return "executable";
}

function normalizeText(text: string) {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function escapeCell(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

void main();
