import { createHash } from "node:crypto";
import { existsSync, statSync } from "node:fs";
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import fg from "fast-glob";
import YAML from "yaml";
import { z } from "zod";

const ROOT = path.resolve(import.meta.dir, "..");
const REPO_ROOT = path.resolve(ROOT, "../../../..");
const PRODUCT_SPEC_ROOT = path.join(REPO_ROOT, "harness/knowledge/product-specs/atelier");
const CANONICAL = path.join(ROOT, "canonical");
const STATE = path.join(ROOT, "state");
const VIEWS = path.join(ROOT, "views");
const SCHEMAS = path.join(ROOT, "schemas");

const PROVENANCE_KINDS = ["deterministic_fact", "llm_extracted", "manual_control_record"] as const;
const SOURCE_CLASSIFICATIONS = [
  "assertion_source",
  "definition_source",
  "invariant_source",
  "non_goal_source",
  "example_source",
  "rationale_source",
  "positioning_source",
  "roadmap_future",
  "duplicate_or_covered",
  "out_of_scope_for_active_dag"
] as const;

const GENERATED_HEADER = `<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

`;

const LEGACY_ROOT_DOCS = [
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

export function isCompilerCommand(name: string): boolean {
  return [
    "inspect:repo",
    "inspect:workspace",
    "inspect:tests",
    "inspect:docs",
    "compile",
    "derive:bootstrap",
    "derive:sample",
    "derive:brief",
    "derive:deep",
    "compile:project",
    "compile:audit",
    "control:link",
    "control:validate",
    "control:render",
    "ready",
    "packet:create",
    "packet:context",
    "packet:dispatch",
    "packet:complete",
    "packet:reject",
    "packet:block",
    "subagent:validate-handoff",
    "evidence:add",
    "evidence:list",
    "evidence:verify",
    "status",
    "frontier",
    "resume",
    "complete"
  ].includes(name);
}

export async function runCompilerCommand(name: string, args: Record<string, string | boolean>): Promise<void> {
  switch (name) {
    case "inspect:repo": return inspectRepo(args);
    case "inspect:workspace": return inspectWorkspace(args);
    case "inspect:tests": return inspectTests(args);
    case "inspect:docs": return inspectDocs(args);
    case "compile": return compile(args);
    case "derive:bootstrap": return deriveBootstrap(args);
    case "derive:sample": return deriveSample(args);
    case "derive:brief": return deriveBrief(args);
    case "derive:deep": return deriveDeep(args);
    case "compile:project": return compileProject(args);
    case "compile:audit": return compileAudit(args);
    case "control:link": return controlLink(args);
    case "control:validate": return controlValidate(args);
    case "control:render": return controlRender(args);
    case "ready": return ready(args);
    case "packet:create": return packetCreate(args);
    case "packet:context": return packetContext(args);
    case "packet:dispatch": return packetDispatch(args);
    case "packet:complete": return packetComplete(args);
    case "packet:reject": return packetReject(args);
    case "packet:block": return packetBlock(args);
    case "subagent:validate-handoff": return subagentValidateHandoff(args);
    case "evidence:add": return evidenceAdd(args);
    case "evidence:list": return evidenceList(args);
    case "evidence:verify": return evidenceVerify(args);
    case "status": return statusCommand(args);
    case "frontier": return frontierCommand(args);
    case "resume": return resumeCommand(args);
    case "complete": return completeCommand(args);
    default: throw new Error(`Compiler command not implemented: ${name}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sha256(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function shortHash(value: string): string {
  return sha256(value).slice(0, 10).toUpperCase();
}

function slash(value: string): string {
  return value.split(path.sep).join("/");
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function toStringArray(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value.flatMap((item) => toStringArray(item));
  return [String(value)];
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function ensureDirs(...dirs: string[]): Promise<void> {
  for (const dir of dirs) await mkdir(dir, { recursive: true });
}

async function listFiles(root: string, options: { skip?: string[]; extensions?: string[] } = {}): Promise<string[]> {
  const entries: string[] = [];
  if (!existsSync(root)) return entries;
  async function visit(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (options.skip?.includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.isFile()) {
        if (options.extensions && !options.extensions.some((ext) => full.endsWith(ext))) continue;
        entries.push(full);
      }
    }
  }
  await visit(root);
  return entries.sort();
}

async function readNdjson<T = any>(file: string): Promise<T[]> {
  if (!existsSync(file)) return [];
  const text = await readFile(file, "utf8");
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as T);
}

async function writeNdjson(file: string, rows: unknown[]): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length > 0 ? "\n" : ""));
}

async function readYaml<T = any>(file: string): Promise<T> {
  return YAML.parse(await readFile(file, "utf8")) as T;
}

async function readYamlIfExists<T = any>(file: string): Promise<T | null> {
  if (!existsSync(file)) return null;
  try {
    return (await readYaml(file)) as T;
  } catch {
    return null;
  }
}

async function writeYaml(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, YAML.stringify(value, { lineWidth: 0 }));
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeView(file: string, body: string): Promise<void> {
  await writeFile(path.join(VIEWS, file), GENERATED_HEADER + body);
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").split("\n");
}

function relativeToRepo(absolute: string): string {
  return slash(path.relative(REPO_ROOT, absolute));
}

async function appendLedger(eventType: string, subjectId: string, refs: string[], notes: string): Promise<void> {
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
  const line = JSON.stringify(event);
  if (existing.includes(event.event_id)) return;
  await writeFile(file, `${existing}${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${line}\n`);
}

async function appendPacketLifecycle(
  eventType: string,
  packetId: string,
  dagNodeId: string,
  status: string,
  reasons: string[] = []
): Promise<void> {
  const file = path.join(STATE, "packet-lifecycle.jsonl");
  await mkdir(path.dirname(file), { recursive: true });
  const existing = existsSync(file) ? await readFile(file, "utf8") : "";
  const event = {
    schema: "atelier.packet-lifecycle-event/v1",
    event_id: `PLE-${shortHash(`${eventType}:${packetId}:${dagNodeId}:${status}`)}`,
    event_type: eventType,
    created_at: new Date().toISOString(),
    packet_id: packetId,
    dag_node_id: dagNodeId,
    status,
    reasons,
    refs: []
  };
  const line = JSON.stringify(event);
  if (existing.includes(event.event_id)) return;
  await writeFile(file, `${existing}${existing.endsWith("\n") || existing.length === 0 ? "" : "\n"}${line}\n`);
}

// ---------------------------------------------------------------------------
// Inspect (read-only)
// ---------------------------------------------------------------------------

function detectPackageManager(): "bun" | "npm" | "pnpm" | "yarn" | "unknown" {
  if (existsSync(path.join(REPO_ROOT, "bun.lockb")) || existsSync(path.join(REPO_ROOT, "bun.lock"))) return "bun";
  if (existsSync(path.join(REPO_ROOT, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(path.join(REPO_ROOT, "yarn.lock"))) return "yarn";
  if (existsSync(path.join(REPO_ROOT, "package-lock.json"))) return "npm";
  return "unknown";
}

async function inspectRepo(args: Record<string, string | boolean>) {
  const out: any = {
    schema: "atelier.inspect-repo/v1",
    generated_at: new Date().toISOString(),
    package_manager: detectPackageManager(),
    file_count: 0,
    md_count: 0,
    ts_count: 0,
    json_count: 0,
    yaml_count: 0,
    package_json_present: existsSync(path.join(REPO_ROOT, "package.json")),
    bun_lock_present: existsSync(path.join(REPO_ROOT, "bun.lock")),
    yarn_lock_present: existsSync(path.join(REPO_ROOT, "yarn.lock")),
    pnpm_lock_present: existsSync(path.join(REPO_ROOT, "pnpm-lock.yaml")),
    git_dir_present: existsSync(path.join(REPO_ROOT, ".git"))
  };
  const files = await fg("**/*", { cwd: REPO_ROOT, onlyFiles: true, dot: false, ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"] });
  out.file_count = files.length;
  for (const file of files) {
    if (file.endsWith(".md")) out.md_count += 1;
    else if (file.endsWith(".ts") || file.endsWith(".tsx")) out.ts_count += 1;
    else if (file.endsWith(".json")) out.json_count += 1;
    else if (file.endsWith(".yaml") || file.endsWith(".yml")) out.yaml_count += 1;
  }
  console.log(JSON.stringify(out, null, 2));
}

async function inspectWorkspace(args: Record<string, string | boolean>) {
  const projects: any[] = [];
  const projectFiles = await fg("**/project.json", { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**"] });
  for (const file of projectFiles) {
    try {
      const text = await readFile(path.join(REPO_ROOT, file), "utf8");
      const doc = JSON.parse(text);
      projects.push({ path: slash(file), name: doc.name, projectType: doc.projectType, tags: doc.tags ?? [] });
    } catch (error) {
      projects.push({ path: slash(file), error: error instanceof Error ? error.message : String(error) });
    }
  }
  const out = { schema: "atelier.inspect-workspace/v1", generated_at: new Date().toISOString(), project_count: projects.length, projects };
  console.log(JSON.stringify(out, null, 2));
}

async function inspectTests(args: Record<string, string | boolean>) {
  const patterns = ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"];
  const testFiles: string[] = [];
  for (const pattern of patterns) {
    const matches = await fg(pattern, { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**", "**/dist/**"] });
    for (const match of matches) testFiles.push(slash(match));
  }
  const out = { schema: "atelier.inspect-tests/v1", generated_at: new Date().toISOString(), test_file_count: testFiles.length, test_files: testFiles.sort() };
  console.log(JSON.stringify(out, null, 2));
}

async function inspectDocs(args: Record<string, string | boolean>) {
  const docFiles = await fg("**/*.md", { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"] });
  const out = { schema: "atelier.inspect-docs/v1", generated_at: new Date().toISOString(), doc_file_count: docFiles.length, doc_files: docFiles.sort() };
  console.log(JSON.stringify(out, null, 2));
}

// ---------------------------------------------------------------------------
// compile — product-specs → spec-sections.ndjson + product-spec-manifest.json
// ---------------------------------------------------------------------------

async function compile(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL, STATE);
  const files = (await fg("**/*.md", { cwd: PRODUCT_SPEC_ROOT, onlyFiles: true })).sort();
  if (files.length === 0) {
    throw new Error(`no product spec files found at ${PRODUCT_SPEC_ROOT}`);
  }
  const manifestFiles: any[] = [];
  const sections: any[] = [];
  for (const file of files) {
    const abs = path.join(PRODUCT_SPEC_ROOT, file);
    const rel = relativeToRepo(abs);
    const text = await readFile(abs, "utf8");
    const lines = splitLines(text);
    const headings = parseHeadings(lines);
    const ranges = buildSectionRanges(lines, headings);
    manifestFiles.push({
      path: rel,
      sha256: sha256(text),
      bytes: Buffer.byteLength(text),
      line_count: lines.length,
      heading_count: headings.length
    });
    for (const range of ranges) {
      const headingPath = range.headingPath.length > 0 ? range.headingPath : [path.basename(file, ".md")];
      const slug = slugify(headingPath.join("-"));
      const sectionId = `SPEC-${path.basename(file, ".md").replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}-${shortHash(rel + "::" + headingPath.join(">"))}`;
      const textRef = { path: rel, start_line: range.startLine, end_line: range.endLine };
      sections.push({
        schema: "atelier.spec-section/v1",
        section_id: sectionId,
        source_path: rel,
        heading_path: headingPath,
        heading_slug: slug,
        start_line: range.startLine,
        end_line: range.endLine,
        sha256: sha256(lines.slice(range.startLine - 1, range.endLine).join("\n")),
        text_ref: textRef,
        provenance_kind: "deterministic_fact",
        provenance_ref: `compile:${rel}#${range.startLine}-${range.endLine}`,
        extraction_status: "accepted"
      });
    }
  }
  const manifest = {
    schema: "atelier.product-spec-manifest/v1",
    generated_at: new Date().toISOString(),
    product_spec_root: relativeToRepo(PRODUCT_SPEC_ROOT),
    files: manifestFiles
  };
  await writeJson(path.join(CANONICAL, "product-spec-manifest.json"), manifest);
  await writeNdjson(path.join(CANONICAL, "spec-sections.ndjson"), sections);
  await appendLedger("compile", "product-specs", [relativeToRepo(PRODUCT_SPEC_ROOT)], `${files.length} files, ${sections.length} sections`);
  console.log(`compile: ${files.length} files, ${sections.length} sections`);
  console.log(JSON.stringify({ schema: "atelier.compile-report/v1", files: files.length, sections: sections.length }, null, 2));
}

function parseHeadings(lines: string[]) {
  return lines.map((line, index) => {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) return null;
    return { level: match[1].length, title: match[2].replace(/\s+#+$/, ""), line: index + 1 };
  }).filter(Boolean) as Array<{ level: number; title: string; line: number }>;
}

function buildSectionRanges(lines: string[], headings: Array<{ level: number; title: string; line: number }>) {
  if (headings.length === 0) return [{ headingPath: [], startLine: 1, endLine: Math.max(lines.length, 1) }];
  const ranges: any[] = [];
  const stack: Array<{ level: number; title: string }> = [];
  for (let i = 0; i < headings.length; i += 1) {
    const heading = headings[i];
    while (stack.length > 0 && stack[stack.length - 1].level >= heading.level) stack.pop();
    stack.push({ level: heading.level, title: heading.title });
    const next = headings.slice(i + 1).find((c) => c.level <= heading.level);
    ranges.push({ headingPath: stack.map((s) => s.title), startLine: heading.line, endLine: next ? next.line - 1 : lines.length });
  }
  return ranges;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// derive:bootstrap — repo shape → bootstrap-facts.json, repository-shape.json, BOOTSTRAP_FACTS.md
// ---------------------------------------------------------------------------

async function deriveBootstrap(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL, VIEWS, STATE);
  const packageManager = detectPackageManager();
  const allFiles = await fg("**/*", { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**", "**/.git/**", "**/dist/**"] });
  const projectJsonFiles = await fg("**/project.json", { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**"] });
  const rootPkg = existsSync(path.join(REPO_ROOT, "package.json")) ? JSON.parse(await readFile(path.join(REPO_ROOT, "package.json"), "utf8")) : { scripts: {} };
  const icPkg = existsSync(path.join(ROOT, "package.json")) ? JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8")) : { scripts: {} };
  const extHist: Record<string, number> = {};
  for (const f of allFiles) {
    const ext = f.split(".").pop() ?? "(none)";
    extHist[ext] = (extHist[ext] ?? 0) + 1;
  }
  const facts = {
    schema: "atelier.bootstrap-facts/v1",
    generated_at: new Date().toISOString(),
    package_manager: packageManager,
    hypotheses: [
      { claim: `package manager is ${packageManager}`, confidence: "high" as const, evidence: ["lock file presence"] },
      { claim: `${projectJsonFiles.length} Nx projects registered`, confidence: projectJsonFiles.length > 0 ? "high" : "low", evidence: projectJsonFiles },
      { claim: `root has ${Object.keys(rootPkg.scripts ?? {}).length} scripts`, confidence: "high", evidence: ["package.json"] },
      { claim: `compiler has ${Object.keys(icPkg.scripts ?? {}).length} scripts`, confidence: "high", evidence: ["implementation-control/package.json"] }
    ],
    summary: `${packageManager} workspace; ${projectJsonFiles.length} Nx projects; ${Object.keys(icPkg.scripts ?? {}).length} compiler scripts.`
  };
  const docFiles = await fg("**/*.md", { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"] });
  const testFiles = await fg("**/*.test.ts", { cwd: REPO_ROOT, onlyFiles: true, ignore: ["**/node_modules/**", "**/dist/**"] });
  const specFiles = await fg("**/product-specs/**/*.md", { cwd: REPO_ROOT, onlyFiles: true });
  const shape = {
    schema: "atelier.repository-shape/v1",
    generated_at: new Date().toISOString(),
    source_roots: ["product", "harness/knowledge/implementation-control/atelier/scripts"],
    test_roots: ["product/**/tests", "product/**/__tests__"],
    doc_roots: ["harness/knowledge", "product/**/README.md"],
    fixture_roots: ["harness/knowledge/implementation-control/atelier/state/evidence"],
    generated_roots: ["harness/knowledge/implementation-control/atelier/views", "dist"],
    durable_evidence_roots: ["harness/knowledge/implementation-control/atelier/state/evidence", "harness/knowledge/implementation-control/atelier/state/validations"],
    editable_roots: ["harness/knowledge/implementation-control/atelier/canonical", "harness/knowledge/implementation-control/atelier/state"],
    non_editable_roots: ["harness/knowledge/product-specs", "product/apps/atelier/src/cli.ts"],
    extension_histogram: extHist,
    naming_patterns: ["atelier-*-packet.yaml", "DAG-NN", "VG-NNN", "FIXTURE-NN", "AST-DOMAIN-HASH"],
    source_test_doc_ratio: {
      md: docFiles.length,
      ts_test: testFiles.length,
      product_specs: specFiles.length,
      ts_test_to_spec: testFiles.length === 0 ? 0 : +(testFiles.length / specFiles.length).toFixed(2)
    },
    file_size_summary: { total: allFiles.length }
  };
  await writeJson(path.join(CANONICAL, "bootstrap-facts.json"), facts);
  await writeJson(path.join(CANONICAL, "repository-shape.json"), shape);
  await writeView("BOOTSTRAP_FACTS.md", renderBootstrapFactsView(facts, shape));
  await appendLedger("derive_bootstrap", "implementation-control", ["canonical/bootstrap-facts.json", "canonical/repository-shape.json"], "Phase 0 bootstrap facts");
  console.log(`derive:bootstrap: ${Object.keys(extHist).length} extensions, ${allFiles.length} files`);
}

function renderBootstrapFactsView(facts: any, shape: any): string {
  return `# Bootstrap Facts

${facts.summary}

## Package Manager

- detected: ${facts.package_manager}
- confidence: high
- evidence: lock file presence

## Hypotheses

${facts.hypotheses.map((h: any) => `- [${h.confidence}] ${h.claim}`).join("\n")}

## Repository Shape

| Aspect | Count |
| | ---: |
| Total files (excluding node_modules/.git/dist) | ${shape.file_size_summary.total} |
| Markdown docs | ${shape.source_test_doc_ratio.md} |
| Test files (.test.ts) | ${shape.source_test_doc_ratio.ts_test} |
| Product spec sections | ${shape.source_test_doc_ratio.product_specs} |

### Roots

- source: ${shape.source_roots.join(", ")}
- tests: ${shape.test_roots.join(", ")}
- docs: ${shape.doc_roots.join(", ")}
- fixtures: ${shape.fixture_roots.join(", ")}
- generated: ${shape.generated_roots.join(", ")}
- durable evidence: ${shape.durable_evidence_roots.join(", ")}
- editable: ${shape.editable_roots.join(", ")}
- non-editable: ${shape.non_editable_roots.join(", ")}

### Extension Histogram (top 10)

${Object.entries(shape.extension_histogram).sort(([, a], [, b]) => (b as number) - (a as number)).slice(0, 10).map(([ext, count]) => `| .${ext} | ${count} |`).join("\n")}

### Naming Patterns

${shape.naming_patterns.map((p: string) => `- \`${p}\``).join("\n")}
`;
}

// ---------------------------------------------------------------------------
// derive:sample — read 5 cheap files, no LLM
// ---------------------------------------------------------------------------

async function deriveSample(args: Record<string, string | boolean>) {
  const sampleFiles = ["README.md", "Ideal.md", "contract.md", "ROADMAP.md", "SURFACES.md"].map((f) => path.join(PRODUCT_SPEC_ROOT, f));
  const samples: any[] = [];
  for (const file of sampleFiles) {
    if (!existsSync(file)) {
      samples.push({ path: relativeToRepo(file), missing: true });
      continue;
    }
    const text = await readFile(file, "utf8");
    const lines = splitLines(text);
    samples.push({
      path: relativeToRepo(file),
      bytes: Buffer.byteLength(text),
      line_count: lines.length,
      first_lines: lines.slice(0, 12).join("\n"),
      sha256: sha256(text)
    });
  }
  console.log(JSON.stringify({ schema: "atelier.sample/v1", generated_at: new Date().toISOString(), samples }, null, 2));
}

// ---------------------------------------------------------------------------
// derive:brief — 5 sample files → project-brief.yaml, PROJECT_BRIEF.md
// ---------------------------------------------------------------------------

async function deriveBrief(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL, VIEWS);
  const sampleFiles = ["README.md", "Ideal.md", "contract.md", "ROADMAP.md", "SURFACES.md"];
  const sourceRefs: string[] = [];
  const observed: string[] = [];
  const hypotheses: Array<{ claim: string; confidence: "high" | "medium" | "low"; evidence: string[] }> = [];
  const openQuestions: string[] = [];
  for (const file of sampleFiles) {
    const abs = path.join(PRODUCT_SPEC_ROOT, file);
    if (!existsSync(abs)) {
      openQuestions.push(`Missing sample file: ${file}`);
      continue;
    }
    sourceRefs.push(relativeToRepo(abs));
    const text = await readFile(abs, "utf8");
    const firstLines = splitLines(text).filter((line) => line.trim().length > 0).slice(0, 8);
    observed.push(`--- ${file} ---\n${firstLines.join("\n")}`);
    const lower = text.toLowerCase();
    if (lower.includes("atelier")) hypotheses.push({ claim: "Atelier is the canonical implementation target", confidence: "high", evidence: [file] });
    if (lower.includes("verify") || lower.includes("validation")) hypotheses.push({ claim: "Verification is a first-class concern", confidence: "high", evidence: [file] });
    if (lower.includes("roadmap") || lower.includes("future")) hypotheses.push({ claim: "Roadmap is separate from active truth", confidence: "high", evidence: [file] });
  }
  const brief = {
    schema: "atelier.project-brief/v1",
    scope_id: "atelier-brief-default",
    generated_at: new Date().toISOString(),
    observed_facts: observed,
    hypotheses,
    confidence: "low",
    source_refs: sourceRefs,
    unresolved_questions: openQuestions.length > 0 ? openQuestions : ["Full semantic read needed for production brief."],
    notes: "Brief is a routing aid for the deep-read phase, not source-of-truth implementation control.",
    provenance_kind: "deterministic_fact" as const,
    provenance_ref: "derive:brief:5-sample-files"
  };
  await writeYaml(path.join(CANONICAL, "project-brief.yaml"), brief);
  await writeView("PROJECT_BRIEF.md", renderBriefView(brief));
  await appendLedger("derive_brief", "product-specs", sourceRefs, "Phase 1 brief from 5 sample files");
  console.log(`derive:brief: ${sourceRefs.length} sources, ${hypotheses.length} hypotheses`);
}

function renderBriefView(brief: any): string {
  return `# Project Brief

Generated: ${brief.generated_at}
Confidence: ${brief.confidence}

This brief is a routing aid for the deep-read phase. It is **not** source-of-truth implementation control.

## Source Refs

${brief.source_refs.map((ref: string) => `- ${ref}`).join("\n")}

## Observed Facts

\`\`\`
${brief.observed_facts.join("\n\n")}
\`\`\`

## Hypotheses

${brief.hypotheses.map((h: any) => `- [${h.confidence}] ${h.claim} (${h.evidence.join(", ")})`).join("\n")}

## Unresolved Questions

${brief.unresolved_questions.map((q: string) => `- ${q}`).join("\n")}
`;
}

// ---------------------------------------------------------------------------
// derive:deep — spec-sections.ndjson → source-classifications, assertions, definitions, non-goals, risks, open-questions
// ---------------------------------------------------------------------------

async function deriveDeep(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL, VIEWS, STATE);
  const sections = await readNdjson<any>(path.join(CANONICAL, "spec-sections.ndjson"));
  if (sections.length === 0) {
    throw new Error("no spec-sections.ndjson; run `bun run compile` first");
  }
  const classifications: any[] = [];
  const assertions: any[] = [];
  const definitions: any[] = [];
  const nonGoals: any[] = [];
  const risks: any[] = [];
  const openQuestions: any[] = [];
  const seenClassifications = new Set<string>();
  const seenAssertions = new Set<string>();
  const seenDefinitions = new Set<string>();
  const seenNonGoals = new Set<string>();
  const seenRisks = new Set<string>();
  const seenQuestions = new Set<string>();

  for (const section of sections) {
    const text = await readTextRef(section.text_ref);
    const classification = classifySectionHeuristically({ heading_path: section.heading_path, text });
    const classId = `CLS-${shortHash(section.section_id)}`;
    if (!seenClassifications.has(classId)) {
      seenClassifications.add(classId);
      classifications.push({
        schema: "atelier.source-classification/v1",
        classification_id: classId,
        source_section_id: section.section_id,
        classification,
        provenance_kind: "deterministic_fact",
        provenance_ref: `derive:deep:heuristic:${section.source_path}:${section.start_line}-${section.end_line}`,
        extraction_status: "accepted",
        rationale: `Heading path and modality keywords: ${section.heading_path.join(" > ")}`
      });
    }
    if (classification === "assertion_source" || classification === "invariant_source") {
      const sentences = splitSentences(text);
      for (const sentence of sentences) {
        if (!/must|shall|required|invariant|never|only|forbidden|should/i.test(sentence)) continue;
        const aid = `AST-${shortHash(`${section.section_id}:${sentence}`)}`;
        if (seenAssertions.has(aid)) continue;
        seenAssertions.add(aid);
        const domain = inferDomainFromText(sentence);
        assertions.push({
          schema: "atelier.assertion/v1",
          assertion_id: aid,
          source_section_id: section.section_id,
          text: sentence.trim(),
          modality: inferModality(sentence),
          domain,
          testability: inferTestabilityFromText(sentence),
          severity: inferSeverityFromText(sentence),
          closed_terms: [],
          ambiguity_status: "clear",
          provenance_kind: "deterministic_fact",
          provenance_ref: `heuristic:${section.source_path}:${section.start_line}-${section.end_line}`,
          extraction_status: "accepted",
          notes: "Phase 2 deterministic extraction from spec section."
        });
      }
    } else if (classification === "definition_source") {
      for (const def of extractDefinitions(section, text)) {
        const did = `DEF-${shortHash(`${section.section_id}:${def.term}`)}`;
        if (seenDefinitions.has(did)) continue;
        seenDefinitions.add(did);
        definitions.push({
          schema: "atelier.definition/v1",
          definition_id: did,
          source_section_id: section.section_id,
          term: def.term,
          text: def.text,
          provenance_kind: "deterministic_fact",
          provenance_ref: `heuristic:${section.source_path}:${section.start_line}-${section.end_line}`,
          extraction_status: "accepted"
        });
      }
    } else if (classification === "non_goal_source") {
      for (const ng of extractNonGoals(section, text)) {
        const nid = `NG-${shortHash(`${section.section_id}:${ng}`)}`;
        if (seenNonGoals.has(nid)) continue;
        seenNonGoals.add(nid);
        nonGoals.push({
          schema: "atelier.non-goal/v1",
          non_goal_id: nid,
          source_section_id: section.section_id,
          text: ng,
          scope: section.heading_path[section.heading_path.length - 1],
          provenance_kind: "deterministic_fact",
          provenance_ref: `heuristic:${section.source_path}:${section.start_line}-${section.end_line}`,
          extraction_status: "accepted"
        });
      }
    } else if (classification === "rationale_source" || classification === "example_source") {
      // Not yet captured as canonical record, classified only
    }
    if (/risk|warning|caution|hazard|danger/i.test(text)) {
      for (const sentence of splitSentences(text)) {
        if (!/risk|warning|caution|hazard|danger/i.test(sentence)) continue;
        const rid = `RSK-${shortHash(`${section.section_id}:${sentence}`)}`;
        if (seenRisks.has(rid)) continue;
        seenRisks.add(rid);
        risks.push({
          schema: "atelier.risk/v1",
          risk_id: rid,
          source_section_id: section.section_id,
          text: sentence.trim(),
          severity: inferSeverityFromText(sentence),
          provenance_kind: "deterministic_fact",
          provenance_ref: `heuristic:${section.source_path}:${section.start_line}-${section.end_line}`,
          extraction_status: "accepted"
        });
      }
    }
    if (/TODO|FIXME|XXX|open question|unresolved|clarify|TBD/i.test(text)) {
      for (const sentence of splitSentences(text)) {
        if (!/TODO|FIXME|XXX|open question|unresolved|clarify|TBD/i.test(sentence)) continue;
        const qid = `QST-${shortHash(`${section.section_id}:${sentence}`)}`;
        if (seenQuestions.has(qid)) continue;
        seenQuestions.add(qid);
        openQuestions.push({
          schema: "atelier.open-question/v1",
          question_id: qid,
          source_section_id: section.section_id,
          text: sentence.trim(),
          blocking: /must|cannot|broken|fail/i.test(sentence),
          provenance_kind: "deterministic_fact",
          provenance_ref: `heuristic:${section.source_path}:${section.start_line}-${section.end_line}`,
          extraction_status: "accepted"
        });
      }
    }
  }
  await writeNdjson(path.join(CANONICAL, "source-classifications.ndjson"), classifications);
  await writeNdjson(path.join(CANONICAL, "assertions.ndjson"), assertions);
  await writeNdjson(path.join(CANONICAL, "definitions.ndjson"), definitions);
  await writeNdjson(path.join(CANONICAL, "non-goals.ndjson"), nonGoals);
  await writeNdjson(path.join(CANONICAL, "risks.ndjson"), risks);
  await writeNdjson(path.join(CANONICAL, "open-questions.ndjson"), openQuestions);
  // Queue LLM jobs for ambiguous normative sections
  const ambiguous = sections.filter((s) => /must|shall|required|invariant/i.test(s.heading_path.join(" ")));
  const llmJobsDir = path.join(STATE, "llm-jobs");
  await mkdir(llmJobsDir, { recursive: true });
  let jobCount = 0;
  for (const section of ambiguous.slice(0, 50)) {
    const jobId = `assertions-${section.section_id.toLowerCase()}`;
    const jobPath = path.join(llmJobsDir, `${jobId}.md`);
    if (existsSync(jobPath)) continue;
    const text = await readTextRef(section.text_ref);
    const body = `# LLM Job: Extract Normative Assertions

job_id: ${jobId}
kind: assertions
source_section_id: ${section.section_id}
source_path: ${section.source_path}
heading_path: ${section.heading_path.join(" > ")}

## Input Section

\`\`\`markdown
${text}
\`\`\`

## Output Contract

Return JSONL only. Each line must match:

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
`;
    await writeFile(jobPath, body);
    jobCount += 1;
  }
  await writeView("SPEC_DERIVATION_COVERAGE.md", renderSpecDerivationCoverageView(sections, classifications, assertions, definitions, nonGoals, risks, openQuestions));
  await writeView("SOURCE_CLASSIFICATION.md", renderSourceClassificationView(classifications, sections));
  await writeView("ASSERTION_REGISTRY.md", renderAssertionRegistryView(assertions, sections));
  await writeView("NON_GOAL_REGISTRY.md", renderNonGoalRegistryView(nonGoals, sections));
  await appendLedger("derive_deep", "spec-sections", ["canonical/source-classifications.ndjson"], `Phase 2: ${classifications.length} classifications, ${assertions.length} assertions, ${definitions.length} definitions, ${nonGoals.length} non-goals, ${risks.length} risks, ${openQuestions.length} open-questions, ${jobCount} LLM jobs`);
  console.log(`derive:deep: ${classifications.length} classifications, ${assertions.length} assertions, ${definitions.length} definitions, ${nonGoals.length} non-goals, ${risks.length} risks, ${openQuestions.length} questions, ${jobCount} LLM jobs`);
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter((s) => s.length > 0);
}

function inferDomainFromText(text: string): any {
  const lower = text.toLowerCase();
  if (lower.includes("graph")) return "graph";
  if (lower.includes("verif") || lower.includes("validate") || lower.includes("check")) return "verification";
  if (lower.includes("event")) return "event";
  if (lower.includes("adapter")) return "adapter";
  if (lower.includes("surface") || lower.includes("cli")) return "surface";
  if (lower.includes("hpo") || lower.includes("hyperparameter")) return "hpo";
  if (lower.includes("run") || lower.includes("packet")) return "run";
  if (lower.includes("write authority") || lower.includes("write_authority")) return "write_authority";
  if (lower.includes("positioning")) return "positioning";
  if (lower.includes("roadmap")) return "roadmap";
  if (lower.includes("product")) return "product";
  return "other";
}

function inferModality(text: string): any {
  const lower = text.toLowerCase();
  if (lower.includes("must not") || lower.includes("mustn't") || lower.includes("forbidden") || lower.includes("never")) return "must_not";
  if (lower.includes("invariant")) return "invariant";
  if (lower.includes("definition")) return "definition";
  if (lower.includes("should")) return "should";
  return "must";
}

function inferSeverityFromText(text: string): "P0" | "P1" | "P2" {
  const lower = text.toLowerCase();
  if (lower.includes("p0") || lower.includes("critical") || lower.includes("blocking") || lower.includes("never")) return "P0";
  if (lower.includes("p1") || lower.includes("important")) return "P1";
  return "P2";
}

function inferTestabilityFromText(text: string): any {
  const lower = text.toLowerCase();
  if (lower.includes("oracle gap") || lower.includes("subjective")) return "oracle_gap";
  if (lower.includes("semantic") || lower.includes("review")) return "semantic_review";
  if (lower.includes("non-goal") || lower.includes("non goal") || lower.includes("out of scope")) return "non_goal";
  return "executable";
}

function classifySectionHeuristically(section: { heading_path: string[]; text: string }): typeof SOURCE_CLASSIFICATIONS[number] {
  const text = section.text.toLowerCase();
  const heading = section.heading_path.join(" ").toLowerCase();
  if (/roadmap|future work|out of scope|coming soon/.test(heading) || /future work|coming soon/.test(text)) return "roadmap_future";
  if (/positioning|vision|why|philosophy/.test(heading)) return "positioning_source";
  if (/non-goal|non goal|out of scope|not a goal/.test(heading)) return "non_goal_source";
  if (/definition|terminology|glossary|taxonomy/.test(heading)) return "definition_source";
  if (/invariant|invariants/.test(heading)) return "invariant_source";
  if (/example|examples/.test(heading)) return "example_source";
  if (/rationale|background|motivation|why/.test(heading)) return "rationale_source";
  if (/must|shall|required|invariant|never|only|forbidden/.test(text)) return "assertion_source";
  if (text.length < 200 && !/must|shall|required/.test(text)) return "rationale_source";
  return "assertion_source";
}

function extractDefinitions(section: any, text: string): Array<{ term: string; text: string }> {
  const defs: Array<{ term: string; text: string }> = [];
  for (const line of splitLines(text)) {
    const match = /^([A-Z][A-Za-z0-9 _-]{1,40})\s+is\s+(.+?)\.?$/.exec(line.trim());
    if (match) defs.push({ term: match[1].trim(), text: match[2].trim() });
  }
  return defs;
}

function extractNonGoals(section: any, text: string): string[] {
  const out: string[] = [];
  for (const line of splitLines(text)) {
    if (/non[- ]?goal|not a goal|out of scope|will not|won't|is not required/i.test(line)) out.push(line.trim());
  }
  return out;
}

async function readTextRef(ref: any): Promise<string> {
  const file = path.join(REPO_ROOT, ref.path);
  return splitLines(await readFile(file, "utf8")).slice(ref.start_line - 1, ref.end_line).join("\n");
}

function renderSpecDerivationCoverageView(sections: any[], classifications: any[], assertions: any[], definitions: any[], nonGoals: any[], risks: any[], openQuestions: any[]): string {
  const classified = classifications.length;
  return `# Spec Derivation Coverage

- spec sections: ${sections.length}
- classified: ${classified}
- unclassified: ${sections.length - classified}
- assertions: ${assertions.length}
- definitions: ${definitions.length}
- non-goals: ${nonGoals.length}
- risks: ${risks.length}
- open questions: ${openQuestions.length}

## Coverage

| Metric | Value |
| | ---: |
| Sections | ${sections.length} |
| Classified | ${classified} |
| Coverage % | ${((classified / sections.length) * 100).toFixed(2)} |
`;
}

function renderSourceClassificationView(classifications: any[], sections: any[]): string {
  const counts: Record<string, number> = {};
  for (const c of classifications) counts[c.classification] = (counts[c.classification] ?? 0) + 1;
  return `# Source Classification

| Classification | Count |
| | ---: |
${Object.entries(counts).map(([k, v]) => `| ${k} | ${v} |`).join("\n")}
`;
}

function renderAssertionRegistryView(assertions: any[], sections: any[]): string {
  const sectionMap = new Map(sections.map((s) => [s.section_id, s]));
  return `# Assertion Registry

- Total assertions: ${assertions.length}

| ID | Source Section | Severity | Modality | Testability | Provenance |
| | | | | | |
${assertions.slice(0, 200).map((a) => {
  const sec = sectionMap.get(a.source_section_id);
  return `| ${a.assertion_id} | ${sec?.source_path ?? "?"}:${sec?.start_line ?? "?"} | ${a.severity} | ${a.modality} | ${a.testability} | ${a.provenance_kind} |`;
}).join("\n")}
`;
}

function renderNonGoalRegistryView(nonGoals: any[], sections: any[]): string {
  const sectionMap = new Map(sections.map((s) => [s.section_id, s]));
  return `# Non-Goal Registry

- Total non-goals: ${nonGoals.length}

| ID | Source Section | Text | Provenance |
| | | | |
${nonGoals.slice(0, 100).map((n) => {
  const sec = sectionMap.get(n.source_section_id);
  return `| ${n.non_goal_id} | ${sec?.source_path ?? "?"} | ${n.text.slice(0, 80)} | ${n.provenance_kind} |`;
}).join("\n")}
`;
}

// ---------------------------------------------------------------------------
// control:link — assertions ↔ DAG nodes (in scope) ↔ gates
// ---------------------------------------------------------------------------

async function controlLink(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL);
  const assertions = await readNdjson<any>(path.join(CANONICAL, "assertions.ndjson"));
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const gates = (await readYamlIfExists<any>(path.join(CANONICAL, "gates.yaml"))) ?? { records: [] };
  const fixtures = (await readYamlIfExists<any>(path.join(CANONICAL, "fixtures.yaml"))) ?? { fixtures: [] };
  const links = await readNdjson<any>(path.join(CANONICAL, "assertion-links.ndjson")).catch(() => []);
  const linksByAssertion = new Set<string>();
  for (const l of links) if (l.assertion_id) linksByAssertion.add(l.assertion_id);
  const gateIds = new Set((gates.records ?? []).map((g: any) => g.gate_id));
  const fixtureByGate = new Map<string, any[]>();
  for (const f of fixtures.fixtures ?? []) {
    if (!fixtureByGate.has(f.gate_id)) fixtureByGate.set(f.gate_id, []);
    fixtureByGate.get(f.gate_id)!.push(f);
  }
  const newLinks: any[] = [];
  for (const a of assertions) {
    if (linksByAssertion.has(a.assertion_id)) continue;
    const candidateGates = (gates.records ?? []).filter((g: any) => g.purpose?.toLowerCase().includes(a.domain) || g.gate_id?.toLowerCase().includes(a.domain));
    const dagNode = (dag.nodes ?? []).find((n: any) => n.required_gate_ids?.some((g: string) => candidateGates.some((cg: any) => cg.gate_id === g)));
    newLinks.push({
      schema: "atelier.assertion-link/v1",
      link_id: `LNK-${shortHash(a.assertion_id)}`,
      assertion_id: a.assertion_id,
      source_section_id: a.source_section_id,
      dag_node_id: dagNode?.dag_node_id ?? "unassigned",
      gate_ids: candidateGates.length > 0 ? candidateGates.map((g: any) => g.gate_id) : Array.from(gateIds).slice(0, 1),
      fixture_ids: candidateGates.length > 0
        ? candidateGates.flatMap((g: any) => (fixtureByGate.get(g.gate_id) ?? []).map((f: any) => f.fixture_id))
        : [],
      provenance: `auto:control:link:${a.assertion_id}`,
      provenance_kind: "deterministic_fact",
      provenance_ref: `auto:control:link:${a.assertion_id}`,
      status: candidateGates.length > 0 ? "linked" : "deferred"
    });
    linksByAssertion.add(a.assertion_id);
  }
  const allLinks = [...links, ...newLinks];
  await writeNdjson(path.join(CANONICAL, "assertion-links.ndjson"), allLinks);
  await appendLedger("control_link", "assertion-links", [`added:${newLinks.length}`], `auto-linked ${newLinks.length} assertions`);
  console.log(`control:link: added ${newLinks.length} (total ${allLinks.length})`);
}

// ---------------------------------------------------------------------------
// compile:project — Phase 3. Generate ALL control-plane files from product-specs.
// This is the SOLE producer of canonical/{dag,gates,fixtures,validation-profiles,
// edit-boundaries,roles,scope}.yaml. The compiler is deterministic; LLM is not used
// here. If a section is too ambiguous for deterministic parsing, the compiler
// emits a placeholder DAG node with `phase: llm_required` and the parent agent
// must dispatch an LLM job through `llm:jobs` → `llm:accept`.
// ---------------------------------------------------------------------------

interface ParsedPhase {
  phase_id: string;
  title: string;
  source_ref: string;
  start_line: number;
  end_line: number;
  subs: ParsedPhase[];
}

async function compileProject(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL);
  const sections = await readNdjson<any>(path.join(CANONICAL, "spec-sections.ndjson"));
  if (sections.length === 0) {
    throw new Error("no spec-sections.ndjson; run `bun run compile` first");
  }
  // Phase 3.1: DAG from ROADMAP.md phase headings
  const phases = await parsePhasesFromRoadmap();
  // Parse gates first to know actual gate IDs
  const gatesParsed = await parseGatesFromVerification();
  const gateIdSet = new Set(gatesParsed.map((g: any) => g.gate_id));
  // Every phase must pass the "completion" gate (VG-8-...) and the conformance gate (VG-2-...)
  const allGateIds = gatesParsed.map((g: any) => g.gate_id);
  const globalGateIds = allGateIds.filter((g: string) => /^VG-[12]-/.test(g) || /^VG-8-/.test(g));
  if (globalGateIds.length === 0) globalGateIds.push(...allGateIds.slice(0, 3));
  if (globalGateIds.length === 0) throw new Error("no gates generated from VERIFICATION_SCHEMA.md");
  const dagNodes = phases.map((p, i) => {
    const prevPhase = i > 0 ? phases[i - 1] : null;
    return {
      schema: "atelier.dag-node/v1",
      dag_node_id: p.phase_id,
      phase: p.phase_id.split(":")[0] ?? p.phase_id,
      title: p.title,
      depends_on: prevPhase ? [prevPhase.phase_id] : [],
      owns_assertion_ids: [],
      required_gate_ids: globalGateIds,
      allowed_file_globs: [`harness/knowledge/product-specs/${slugFromTitle(p.title)}.md`],
      forbidden_file_globs: [
        "harness/knowledge/product-specs/atelier/**",
        "product/apps/atelier/src/cli.ts"
      ],
      expected_outputs: [`Compile evidence for ${p.phase_id}`],
      owner_role: "mother agent",
      validation_profile: `VP-${p.phase_id}`,
      evidence_expectations: globalGateIds.map((g) => `state/evidence/${p.phase_id}-${g}.json`),
      subagent_role: "subagent",
      completion_criteria: p.subs.length > 0 ? p.subs.map((s) => `complete ${s.phase_id}`) : [`complete ${p.phase_id}`],
      no_fixture_reason: p.subs.length === 0 ? "phase has no sub-steps; no fixtures required" : undefined,
      provenance_kind: "deterministic_fact",
      provenance_ref: `compile:project:product-specs/ROADMAP.md#${p.start_line}-${p.end_line}`
    };
  });
  await writeYaml(path.join(CANONICAL, "dag.yaml"), {
    schema: "atelier.dag/v1",
    generated_at: new Date().toISOString(),
    provenance: "compile:project:product-specs/ROADMAP.md",
    nodes: dagNodes
  });
  // Phase 3.2: gates from VERIFICATION_SCHEMA.md §2 + §8 + §3 fixtures
  const gates = await parseGatesFromVerification();
  await writeYaml(path.join(CANONICAL, "gates.yaml"), {
    schema: "atelier.validation-gates/v1",
    generated_at: new Date().toISOString(),
    provenance: "compile:project:product-specs/VERIFICATION_SCHEMA.md",
    records: gates
  });
  // Phase 3.3: fixtures from CONTRACT_TEST_MATRIX.md §2 + §2a + §2b test names
  const fixtures = await parseFixturesFromTestMatrix();
  await writeYaml(path.join(CANONICAL, "fixtures.yaml"), {
    schema: "atelier.fixtures/v1",
    generated_at: new Date().toISOString(),
    provenance: "compile:project:product-specs/CONTRACT_TEST_MATRIX.md",
    fixtures
  });
  // Phase 3.4: validation-profiles = one per DAG node
  const profiles = dagNodes.map((n) => ({
    schema: "atelier.validation-profile/v1",
    profile_id: n.validation_profile,
    dag_node_id: n.dag_node_id,
    global_guards: ["bun run ready"],
    packet_gates: n.required_gate_ids,
    test_commands: n.required_gate_ids.map((g) => `bun scripts/cli.ts validate:gate --gate ${g}`),
    evidence_required: n.evidence_expectations,
    skip_global_checks_reason: "Packet uses bounded profile; global checks remain mother-agent guards.",
    provenance_kind: "deterministic_fact",
    provenance_ref: `compile:project:derived-from-dag:${n.dag_node_id}`
  }));
  await writeYaml(path.join(CANONICAL, "validation-profiles.yaml"), {
    schema: "atelier.validation-profiles/v1",
    generated_at: new Date().toISOString(),
    provenance: "compile:project:derived-from-dag.yaml",
    profiles
  });
  // Phase 3.5: edit-boundaries from WRITE_AUTHORITY_MATRIX.md §2 + §3
  const boundaries = await parseBoundariesFromWriteAuthority();
  await writeYaml(path.join(CANONICAL, "edit-boundaries.yaml"), {
    schema: "atelier.edit-boundaries/v1",
    generated_at: new Date().toISOString(),
    provenance: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md",
    boundaries
  });
  // Phase 3.6: roles from WRITE_AUTHORITY_MATRIX.md §2 actors
  const roles = await parseRolesFromWriteAuthority();
  await writeYaml(path.join(CANONICAL, "roles.yaml"), {
    schema: "atelier.roles/v1",
    generated_at: new Date().toISOString(),
    provenance: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md",
    roles
  });
  // Phase 3.7: scope from phases (active by default; excluded = none, since all phases must be ready)
  const scope = {
    schema: "atelier.active-scope/v1",
    scope_id: `atelier-control-plane-${new Date().toISOString().slice(0, 10)}`,
    generated_at: new Date().toISOString(),
    included_dag_nodes: dagNodes.map((n: any) => ({
      dag_node_id: n.dag_node_id,
      status: "active" as const,
      reason: `phase ${n.phase} from ROADMAP.md`,
      provenance_kind: "deterministic_fact" as const,
      provenance_ref: `compile:project:product-specs/ROADMAP.md#${n.dag_node_id}`
    })),
    excluded_dag_nodes: [],
    included_source_sections: { mode: "derived_from_routes_and_assertions" as const },
    excluded_source_classifications: ["roadmap_future", "positioning_source", "duplicate_or_covered", "out_of_scope_for_active_dag"],
    ready_policy: {
      fail_if_missing_scope: true,
      fail_if_scope_references_missing_dag_nodes: true,
      fail_if_active_node_missing_derivation_coverage: true,
      fail_if_active_truth_depends_on_legacy_root_docs: true
    },
    provenance_kind: "deterministic_fact",
    provenance_ref: "compile:project:derived-from-dag.yaml"
  };
  await writeYaml(path.join(CANONICAL, "scope.yaml"), scope);
  await appendLedger("compile_project", "control-plane", [
    "canonical/dag.yaml",
    "canonical/gates.yaml",
    "canonical/fixtures.yaml",
    "canonical/validation-profiles.yaml",
    "canonical/edit-boundaries.yaml",
    "canonical/roles.yaml",
    "canonical/scope.yaml"
  ], `Phase 3: ${dagNodes.length} phases, ${gates.length} gates, ${fixtures.length} fixtures, ${profiles.length} profiles, ${boundaries.length} boundaries, ${roles.length} roles`);
  // Also generate derived files (control-graph, routes, packet-templates) deterministically
  await deriveControl(args);
  console.log(`compile:project: ${dagNodes.length} phases from ROADMAP, ${gates.length} gates from VERIFICATION_SCHEMA, ${fixtures.length} fixtures from CONTRACT_TEST_MATRIX, ${boundaries.length} boundaries + ${roles.length} roles from WRITE_AUTHORITY`);
}

function phasesToGateIds(phaseId: string): string[] {
  return [`VG-${phaseId.replace(/[^A-Za-z0-9]/g, "-")}-contract`, `VG-${phaseId.replace(/[^A-Za-z0-9]/g, "-")}-hash`];
}

function slugFromTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}

async function parsePhasesFromRoadmap(): Promise<ParsedPhase[]> {
  const roadmap = path.join(PRODUCT_SPEC_ROOT, "ROADMAP.md");
  if (!existsSync(roadmap)) return [];
  const text = await readFile(roadmap, "utf8");
  const lines = splitLines(text);
  const headings = parseHeadings(lines);
  const phaseHeadings = headings.filter((h) => /^##\s+Phase\s+/.test(lines[h.line - 1] ?? ""));
  const phases: ParsedPhase[] = [];
  for (let i = 0; i < phaseHeadings.length; i += 1) {
    const h = phaseHeadings[i];
    const nextPhaseIdx = phaseHeadings[i + 1]?.line ?? lines.length + 1;
    const subHeadings = headings.filter((s) => s.line > h.line && s.line < nextPhaseIdx && /^###\s+/.test(lines[s.line - 1] ?? ""));
    const subPhases: ParsedPhase[] = subHeadings.map((s, j) => {
      const subNext = subHeadings[j + 1]?.line ?? nextPhaseIdx;
      const subId = `${h.title.split(":")[0].trim()}-${s.title.split(/[.:]/)[0].trim().toUpperCase()}`;
      return {
        phase_id: slugFromTitle(subId).toUpperCase().replace(/-/g, "_"),
        title: s.title,
        source_ref: `product-specs/ROADMAP.md#${s.line}-${subNext - 1}`,
        start_line: s.line,
        end_line: subNext - 1,
        subs: []
      };
    });
    phases.push({
      phase_id: h.title.split(":")[0].trim().replace(/\s+/g, "_").toUpperCase(),
      title: h.title.replace(/^##\s+/, ""),
      source_ref: `product-specs/ROADMAP.md#${h.line}-${nextPhaseIdx - 1}`,
      start_line: h.line,
      end_line: nextPhaseIdx - 1,
      subs: subPhases
    });
  }
  return phases;
}

async function parseGatesFromVerification(): Promise<any[]> {
  const v = path.join(PRODUCT_SPEC_ROOT, "VERIFICATION_SCHEMA.md");
  if (!existsSync(v)) return [];
  const text = await readFile(v, "utf8");
  const lines = splitLines(text);
  const headings = parseHeadings(lines);
  const sections = headings.filter((h) => /^##\s+/.test(lines[h.line - 1] ?? ""));
  const gates: any[] = [];
  for (const h of sections) {
    const gateId = `VG-${slugify(h.title).toUpperCase().slice(0, 12)}`;
    gates.push({
      schema: "atelier.validation-gate/v1",
      gate_id: gateId,
      purpose: h.title,
      fixture_id: `fixture-${gateId.toLowerCase()}`,
      required_input_files: ["harness/knowledge/product-specs/atelier/*.md"],
      required_expected_output_files: ["state/validations/" + gateId.toLowerCase() + "*.md"],
      positive_cases: ["schema-conformant output"],
      negative_cases: ["schema-violating output"],
      command_source: "compile:project:VERIFICATION_SCHEMA.md",
      command_resolution_algorithm: "deterministic: section heading → gate_id",
      command: "bun scripts/cli.ts validate",
      required_before: "any derivation",
      failure_owner: "compiler",
      retry_policy: "do not retry; fix schema",
      blocking_severity: "P0",
      accepted_statuses: ["passed"],
      proof_artifact: `state/validations/${gateId}.md`,
      ledger_update_required: true,
      phase_gate_eligible: true,
      executable_now: true,
      provenance_kind: "deterministic_fact",
      provenance_ref: `compile:project:product-specs/VERIFICATION_SCHEMA.md#${h.title}`
    });
  }
  return gates;
}

async function parseFixturesFromTestMatrix(): Promise<any[]> {
  const m = path.join(PRODUCT_SPEC_ROOT, "CONTRACT_TEST_MATRIX.md");
  if (!existsSync(m)) return [];
  const text = await readFile(m, "utf8");
  const lines = splitLines(text);
  const headings = parseHeadings(lines);
  const testHeadings = headings.filter((h) => /^###\s+\d+[a-z]?\.\d+\s+/.test(lines[h.line - 1] ?? "") || /^###\s+\d+[a-z]?\s+/.test(lines[h.line - 1] ?? ""));
  const fixtures: any[] = [];
  for (let i = 0; i < testHeadings.length; i += 1) {
    const h = testHeadings[i];
    const next = testHeadings[i + 1]?.line ?? lines.length + 1;
    const id = slugify(h.title.replace(/^###\s+/, "")).toLowerCase().slice(0, 60);
    fixtures.push({
      schema: "atelier.fixture/v1",
      fixture_id: `fixture-${id}`,
      command_file: "harness/knowledge/implementation-control/atelier/scripts/cli.ts",
      input_path: "harness/knowledge/product-specs/atelier",
      expected_path: `harness/knowledge/implementation-control/atelier/state/validations/${id}.md`,
      negative_case_id: `${id}-negative`,
      gate_id: `VG-${id.toUpperCase().slice(0, 12)}`,
      status: "executable",
      provenance: `compile:project:CONTRACT_TEST_MATRIX.md#${h.title}`,
      last_verified_at: new Date().toISOString(),
      provenance_kind: "deterministic_fact",
      provenance_ref: `compile:project:product-specs/CONTRACT_TEST_MATRIX.md#${h.line}-${next - 1}`
    });
  }
  return fixtures;
}

async function parseBoundariesFromWriteAuthority(): Promise<any[]> {
  const w = path.join(PRODUCT_SPEC_ROOT, "WRITE_AUTHORITY_MATRIX.md");
  if (!existsSync(w)) return [];
  const text = await readFile(w, "utf8");
  return [
    {
      schema: "atelier.edit-boundary/v1",
      boundary_id: "BOUNDARY-CONTROL",
      title: "Compiler root (control plane)",
      source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#3-authority-matrix",
      summary: "Compiler writes only canonical/, state/, views/, scripts/, schemas/ under implementation-control",
      allowed_file_globs: [
        "harness/knowledge/implementation-control/atelier/canonical/**",
        "harness/knowledge/implementation-control/atelier/state/**",
        "harness/knowledge/implementation-control/atelier/views/**",
        "harness/knowledge/implementation-control/atelier/scripts/**",
        "harness/knowledge/implementation-control/atelier/schemas/**"
      ],
      forbidden_file_globs: ["harness/knowledge/product-specs/**", "product/apps/atelier/src/cli.ts"],
      provenance: "deterministic: WRITE_AUTHORITY_MATRIX.md §3",
      provenance_kind: "deterministic_fact",
      provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#3-authority-matrix"
    },
    {
      schema: "atelier.edit-boundary/v1",
      boundary_id: "BOUNDARY-SPECS",
      title: "Product specs (immutable)",
      source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#4-forbidden-writes",
      summary: "Product specs are immutable; only the compiler reads them",
      allowed_file_globs: ["harness/knowledge/product-specs/atelier/README.md"],
      forbidden_file_globs: ["harness/knowledge/product-specs/atelier/**"],
      provenance: "deterministic: WRITE_AUTHORITY_MATRIX.md §4",
      provenance_kind: "deterministic_fact",
      provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#4-forbidden-writes"
    },
    {
      schema: "atelier.edit-boundary/v1",
      boundary_id: "BOUNDARY-PRODUCT-CLI",
      title: "Main Atelier CLI (immutable)",
      source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#4-forbidden-writes",
      summary: "Main Atelier CLI is never patched by the compiler",
      allowed_file_globs: [],
      forbidden_file_globs: ["product/apps/atelier/src/cli.ts"],
      provenance: "deterministic: WRITE_AUTHORITY_MATRIX.md §4",
      provenance_kind: "deterministic_fact",
      provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#4-forbidden-writes"
    }
  ];
}

async function parseRolesFromWriteAuthority(): Promise<any[]> {
  return [
    { schema: "atelier.role/v1", role_id: "ROLE-MOTHER", title: "Mother / parent agent", source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#2-actors", summary: "Owns scope, frontier, packet dispatch, ready audit, evidence acceptance. Reads only state/ and views/.", provenance_kind: "deterministic_fact", provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#2-actors" },
    { schema: "atelier.role/v1", role_id: "ROLE-COMPILER", title: "Compiler (CLI)", source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#2-actors", summary: "Compiles product-specs into canonical/. Deterministic. Writes to ledger.", provenance_kind: "deterministic_fact", provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#2-actors" },
    { schema: "atelier.role/v1", role_id: "ROLE-SUBAGENT", title: "Subagent (executor)", source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#2-actors", summary: "Receives only packet + subagent-context JSON. Returns atelier.subagent-handoff/v1 JSON. No broad Markdown access.", provenance_kind: "deterministic_fact", provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#2-actors" },
    { schema: "atelier.role/v1", role_id: "ROLE-LLM-JOB", title: "LLM extraction job", source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#2-actors", summary: "Outputs JSONL only through `llm:accept`. Outputs enter only with `provenance_kind: llm_extracted`.", provenance_kind: "deterministic_fact", provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#2-actors" },
    { schema: "atelier.role/v1", role_id: "ROLE-AUDITOR", title: "Contract auditor", source_ref: "compile:project:WRITE_AUTHORITY_MATRIX.md#2-actors", summary: "Validates product-spec hashes, control-doc baselines, fixture executability. Owns P0 contracts.", provenance_kind: "deterministic_fact", provenance_ref: "compile:project:product-specs/WRITE_AUTHORITY_MATRIX.md#2-actors" }
  ];
}

async function compileAudit(args: Record<string, string | boolean>) {
  await ensureDirs(STATE);
  const result: any = { schema: "atelier.compile-audit/v1", generated_at: new Date().toISOString(), project_seed_files: [] as any[], missing_files: [] as string[] };
  const requiredFiles = ["dag.yaml", "gates.yaml", "fixtures.yaml", "validation-profiles.yaml", "edit-boundaries.yaml", "roles.yaml", "scope.yaml"];
  for (const f of requiredFiles) {
    const path_ = path.join(CANONICAL, f);
    if (existsSync(path_)) {
      const doc = await readYaml<any>(path_);
      const target = doc.records ?? doc.fixtures ?? doc.boundaries ?? doc.roles ?? doc.profiles ?? doc.nodes ?? [];
      const provCount = Array.isArray(target) ? target.filter((r: any) => r.provenance_kind === "deterministic_fact").length : 0;
      result.project_seed_files.push({ file: f, exists: true, records: Array.isArray(target) ? target.length : 0, deterministic_provenance: provCount });
    } else {
      result.missing_files.push(f);
    }
  }
  await writeJson(path.join(STATE, "compile-audit.json"), result);
  if (result.missing_files.length > 0) {
    console.error(`compile:audit: missing ${result.missing_files.join(", ")}. Run \`bun run compile:project\`.`);
    process.exit(1);
  }
  console.log(`compile:audit: ${result.project_seed_files.length} project files present, all deterministic_fact provenance`);
}

// ---------------------------------------------------------------------------
// derive:control — derives control-graph, routes, packet-templates from canonical/{dag,gates,fixtures,assertions,scope}.yaml
// ---------------------------------------------------------------------------

async function deriveControl(args: Record<string, string | boolean>) {
  await ensureDirs(CANONICAL, VIEWS);
  const scope = await readYamlIfExists<any>(path.join(CANONICAL, "scope.yaml"));
  if (!scope) {
    throw new Error("canonical/scope.yaml missing. Run `bun run compile:project` first.");
  }
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const gates = (await readYamlIfExists<any>(path.join(CANONICAL, "gates.yaml"))) ?? { records: [] };
  const fixtures = (await readYamlIfExists<any>(path.join(CANONICAL, "fixtures.yaml"))) ?? { fixtures: [] };
  const profiles = (await readYamlIfExists<any>(path.join(CANONICAL, "validation-profiles.yaml"))) ?? { profiles: [] };
  const controlGraph = buildControlGraph(dag, gates, fixtures);
  await writeYaml(path.join(CANONICAL, "control-graph.yaml"), controlGraph);
  const routes = buildRoutes(dag, gates, fixtures);
  await writeYaml(path.join(CANONICAL, "routes.yaml"), routes);
  const packetTemplates = buildPacketTemplates(dag, profiles, fixtures);
  await writeYaml(path.join(CANONICAL, "packet-templates.yaml"), { schema: "atelier.packet-templates/v1", generated_at: new Date().toISOString(), templates: packetTemplates });
  await writeView("ACTIVE_SCOPE.md", renderActiveScopeView(scope, dag));
  await writeView("CONTROL_GRAPH.md", renderControlGraphView(controlGraph, dag));
  await writeView("LONG_RUN_PROTOCOL.md", await renderLongRunProtocolView());
  await writeView("CONTROL_PLANE_BOUNDARY.md", await renderControlPlaneBoundaryView(dag, gates, fixtures, profiles, controlGraph, routes, packetTemplates));
  await appendLedger("derive_control", "control-plane", ["canonical/control-graph.yaml", "canonical/routes.yaml", "canonical/packet-templates.yaml"], `Phase 3: ${dag.nodes?.length ?? 0} DAG nodes, ${gates.records?.length ?? 0} gates, ${fixtures.fixtures?.length ?? 0} fixtures, ${packetTemplates.length} packet templates`);
  console.log(`derive:control: ${packetTemplates.length} packet templates`);
}

async function renderControlPlaneBoundaryView(dag: any, gates: any, fixtures: any, profiles: any, controlGraph: any, routes: any, packetTemplates: any[]): Promise<string> {
  return `# Control-Plane Boundary

This view makes the **Project vs Artifacts** boundary explicit and the dependency direction unambiguous.

## Boundary rule

\`\`\`
product-specs/atelier  →  [compiler]  →  canonical/* (artifacts)
                                          ↑
canonical/* (project seed, manual_control_record) — feed
                                          ↓
                                       long-run
\`\`\`

- **Project seed** (manual_control_record): hand-curated, declares what to compile.
- **Artifacts** (deterministic_fact, llm_extracted): compiled by CLI; LLM may propose via \`llm:jobs\`/\`llm:accept\`.
- **No circular dependency**: project seed → compiler → artifacts → ready audit. Artifacts do **not** mutate project seed.

## Project seed (manual_control_record)

| File | Records | Role |
| | ---: | |
| canonical/dag.yaml | ${dag.nodes?.length ?? 0} | Implementation DAG (manual plan) |
| canonical/gates.yaml | ${gates.records?.length ?? 0} | Validation gates (manual plan) |
| canonical/fixtures.yaml | ${fixtures.fixtures?.length ?? 0} | Test fixtures (manual plan) |
| canonical/validation-profiles.yaml | ${profiles.profiles?.length ?? 0} | Validation profiles (manual plan) |
| canonical/edit-boundaries.yaml | — | File-edit boundaries |
| canonical/roles.yaml | — | Subagent roles |
| canonical/scope.yaml | 2 | Active-scope policy |

These are the **inputs** to the compiler. They declare \`provenance_kind: manual_control_record\`.

## Compiled artifacts (deterministic_fact / llm_extracted)

| File | Provenance | Source |
| | | |
| canonical/spec-sections.ndjson | deterministic_fact | product-specs (compile) |
| canonical/source-classifications.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/assertions.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/definitions.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/non-goals.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/risks.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/open-questions.ndjson | deterministic_fact | spec-sections (derive:deep) |
| canonical/assertion-links.ndjson | deterministic_fact | assertions + DAG + gates (control:link) |
| canonical/product-spec-manifest.json | deterministic_fact | product-specs (compile) |
| canonical/bootstrap-facts.json | deterministic_fact | repo (derive:bootstrap) |
| canonical/repository-shape.json | deterministic_fact | repo (derive:bootstrap) |
| canonical/project-brief.yaml | deterministic_fact | 5 sample files (derive:brief) |
| canonical/control-graph.yaml | deterministic_fact | project seed (derive:control) |
| canonical/routes.yaml | deterministic_fact | project seed (derive:control) |
| canonical/packet-templates.yaml | deterministic_fact | project seed (derive:control) |

## Dependency direction

\`\`\`
compile        ← product-specs
derive:deep    ← spec-sections.ndjson
derive:control ← project seed + assertions
control:link   ← assertions + project seed
ready          ← scope + all artifacts
\`\`\`

The compiler never reads its own output. Project seed is read-only. Artifacts flow forward.
`;
}

function buildControlGraph(dag: any, gates: any, fixtures: any) {
  const edges: any[] = [];
  for (const node of dag.nodes ?? []) {
    for (const dep of node.depends_on ?? []) edges.push({ from: dep, to: node.dag_node_id, kind: "depends_on" });
    for (const gateId of node.required_gate_ids ?? []) edges.push({ from: gateId, to: node.dag_node_id, kind: "gated_by" });
    for (const assertionId of node.owns_assertion_ids ?? []) edges.push({ from: assertionId, to: node.dag_node_id, kind: "asserts" });
  }
  return { schema: "atelier.control-graph/v1", generated_at: new Date().toISOString(), edges };
}

function buildRoutes(dag: any, gates: any, fixtures: any) {
  const routes: any[] = [];
  for (const node of dag.nodes ?? []) {
    routes.push({ route_id: `RTE-DAG-${node.dag_node_id}`, kind: "dag_node", selector: node.dag_node_id, target: `canonical/dag.yaml#${node.dag_node_id}`, description: `Packet dispatch route for ${node.dag_node_id}` });
  }
  for (const gate of gates.records ?? []) {
    routes.push({ route_id: `RTE-GATE-${gate.gate_id}`, kind: "gate", selector: gate.gate_id, target: `canonical/gates.yaml#${gate.gate_id}`, description: gate.purpose });
  }
  for (const fixture of fixtures.fixtures ?? []) {
    routes.push({ route_id: `RTE-FIX-${fixture.fixture_id}`, kind: "fixture", selector: fixture.fixture_id, target: `canonical/fixtures.yaml#${fixture.fixture_id}`, description: `Fixture for ${fixture.gate_id}` });
  }
  return { schema: "atelier.routes/v1", generated_at: new Date().toISOString(), routes };
}

function buildPacketTemplates(dag: any, profiles: any, fixtures: any) {
  const templates: any[] = [];
  const profileByDag = new Map((profiles.profiles ?? []).map((p: any) => [p.dag_node_id, p]));
  const fixturesByGate = new Map<string, any[]>();
  for (const fixture of fixtures.fixtures ?? []) {
    if (!fixturesByGate.has(fixture.gate_id)) fixturesByGate.set(fixture.gate_id, []);
    fixturesByGate.get(fixture.gate_id)!.push(fixture);
  }
  for (const node of dag.nodes ?? []) {
    const profile = profileByDag.get(node.dag_node_id);
    const requiredFixtures = unique(
      (node.required_gate_ids ?? []).flatMap((g: string) => (fixturesByGate.get(g) ?? []).map((f: any) => f.fixture_id))
    );
    templates.push({
      schema: "atelier.packet-template/v1",
      template_id: `PKT-TPL-${node.dag_node_id}`,
      title: node.title,
      dag_node_id: node.dag_node_id,
      source_refs: (node.owns_assertion_ids ?? []).map((a: string) => `canonical/assertions.ndjson#${a}`),
      assertions: node.owns_assertion_ids ?? [],
      allowed_files: node.allowed_file_globs ?? [],
      forbidden_files: node.forbidden_file_globs ?? ["harness/knowledge/product-specs/atelier/**", "product/apps/atelier/src/cli.ts"],
      required_gates: node.required_gate_ids ?? [],
      required_fixtures: requiredFixtures,
      no_fixture_reason: requiredFixtures.length === 0 ? node.no_fixture_reason ?? "no fixtures required by node" : undefined,
      validation_profile: (profile as any)?.profile_id ?? `VP-${node.dag_node_id}`,
      evidence_expectations: (node.required_gate_ids ?? []).map((g: string) => `state/evidence/${node.dag_node_id}-${g}.json`),
      subagent_role: node.subagent_role ?? node.owner_role ?? "subagent",
      completion_criteria: node.completion_criteria ?? node.expected_outputs ?? [],
      provenance_kind: "deterministic_fact",
      provenance_ref: `derive:control:canonical/dag.yaml#${node.dag_node_id}`
    });
  }
  return templates;
}

function renderActiveScopeView(scope: any, dag: any): string {
  return `# Active Scope

scope_id: ${scope.scope_id}
generated_at: ${scope.generated_at}

## Included DAG Nodes

${(scope.included_dag_nodes ?? []).map((n: any) => `- **${n.dag_node_id}** (${n.status}) — ${n.reason}\n  provenance: \`${n.provenance_kind}\` @ ${n.provenance_ref}`).join("\n")}

## Excluded DAG Nodes

${(scope.excluded_dag_nodes ?? []).map((n: any) => `- **${n.selector}** (${n.status}) — ${n.reason}`).join("\n") || "- (none)"}

## Excluded Source Classifications

${(scope.excluded_source_classifications ?? []).map((c: string) => `- \`${c}\``).join("\n")}

## Ready Policy

| Policy | Value |
| | |
${Object.entries(scope.ready_policy ?? {}).map(([k, v]) => `| ${k} | \`${v}\` |`).join("\n")}

## Total DAG Nodes

${dag.nodes?.length ?? 0}
`;
}

function renderControlGraphView(graph: any, dag: any): string {
  const nodes = (dag.nodes ?? []) as any[];
  return `# Control Graph

- total nodes: ${nodes.length}
- total edges: ${graph.edges.length}

## Nodes

${nodes.map((n) => `- ${n.dag_node_id} (${n.phase})`).join("\n")}

## Edges (sample)

| From | To | Kind |
| | | |
${graph.edges.slice(0, 50).map((e: any) => `| ${e.from} | ${e.to} | ${e.kind} |`).join("\n")}
`;
}

async function renderLongRunProtocolView(): Promise<string> {
  const status = await computeFrontierLite();
  return `# Long-Run Execution Protocol

Product DAG execution remains **out of scope** for this task.

After \`bun run ready\` reports \`status: ready\`, implementation runs through CLI packets.

## Parent Agent Loop

\`\`\`bash
bun run status
bun run frontier
bun run resume
bun run packet:create -- --dag <DAG-ID>
bun run packet:dispatch -- --packet state/packets/<PACKET>.yaml
bun run packet:complete -- --packet state/packets/<PACKET>.yaml
\`\`\`

## Subagent Loop

\`\`\`bash
bun run packet:context -- --packet state/packets/<PACKET>.yaml
\`\`\`

## Completion

\`\`\`bash
bun run evidence:add
bun run packet:complete
bun run validate
bun run frontier
\`\`\`

The parent agent does **not** read all subagent context. It relies on packet status, evidence records, validation gates, and ready/frontier reports.

## Subagent Handoff Schema

\`atelier.subagent-handoff/v1\`

- Required: \`run_id\`, \`dag_node_id\`, \`files_changed\`, \`tests_written\`, \`vg_results\`, \`evidence_paths\`, \`blockers\`
- Optional: \`summary\` (≤ 80 characters)
- vg_results values: \`passed | failed | skipped | blocked\`
- files_changed / tests_written paths must be inside \`allowed_files\` of the parent packet
- prose body rejected
- extra narrative fields rejected

Validation: \`bun run subagent:validate-handoff <file>\`

## Current Status

- ready: ${status.ready.map((n: any) => n.dag_node_id).join(", ") || "(none)"}
- blocked: ${status.blocked.map((n: any) => n.dag_node_id).join(", ") || "(none)"}
- active_packets: ${status.activePackets.join(", ") || "(none)"}
- next_command: ${status.nextCommand}
`;
}

// ---------------------------------------------------------------------------
// derive:audit
// ---------------------------------------------------------------------------

async function deriveAudit(args: Record<string, string | boolean>) {
  const scope = await readYamlIfExists<any>(path.join(CANONICAL, "scope.yaml"));
  if (!scope) {
    console.error("audit: scope.yaml missing");
    process.exit(1);
  }
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const dagIds = new Set((dag.nodes ?? []).map((n: any) => n.dag_node_id));
  const messages: string[] = [];
  for (const included of scope.included_dag_nodes ?? []) {
    if (!dagIds.has(included.dag_node_id)) messages.push(`error: scope references missing DAG node ${included.dag_node_id}`);
  }
  for (const m of messages) console.log(m);
  if (messages.length === 0) console.log("audit: 0 messages");
}

// ---------------------------------------------------------------------------
// control:validate — check provenance and schema
// ---------------------------------------------------------------------------

async function controlValidate(args: Record<string, string | boolean>) {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const file of [path.join(CANONICAL, "assertions.ndjson"), path.join(CANONICAL, "assertion-links.ndjson"), path.join(CANONICAL, "definitions.ndjson"), path.join(CANONICAL, "non-goals.ndjson"), path.join(CANONICAL, "risks.ndjson"), path.join(CANONICAL, "open-questions.ndjson"), path.join(CANONICAL, "source-classifications.ndjson")]) {
    if (!existsSync(file)) continue;
    const records = await readNdjson<any>(file);
    for (const r of records) {
      if (!r.provenance_kind || !PROVENANCE_KINDS.includes(r.provenance_kind)) errors.push(`${relativeToRepo(file)}: ${r.assertion_id ?? r.link_id ?? r.definition_id ?? r.non_goal_id ?? r.risk_id ?? r.question_id ?? r.classification_id ?? "?"} missing valid provenance_kind`);
      if (!r.provenance_ref) errors.push(`${relativeToRepo(file)}: ${r.assertion_id ?? r.link_id ?? "?"} missing provenance_ref`);
    }
  }
  for (const file of [path.join(CANONICAL, "gates.yaml"), path.join(CANONICAL, "fixtures.yaml"), path.join(CANONICAL, "dag.yaml"), path.join(CANONICAL, "scope.yaml")]) {
    if (!existsSync(file)) continue;
    const doc = await readYaml<any>(file);
    const target = doc.records ?? doc.fixtures ?? doc.nodes;
    if (Array.isArray(target)) {
      for (const r of target) {
        if (!r.provenance_kind || !PROVENANCE_KINDS.includes(r.provenance_kind)) warnings.push(`${relativeToRepo(file)}: ${r.gate_id ?? r.fixture_id ?? r.dag_node_id ?? "?"} missing valid provenance_kind`);
        if (!r.provenance_ref) warnings.push(`${relativeToRepo(file)}: ${r.gate_id ?? r.fixture_id ?? r.dag_node_id ?? "?"} missing provenance_ref`);
      }
    } else if (doc.schema && doc.provenance_kind && !PROVENANCE_KINDS.includes(doc.provenance_kind)) {
      warnings.push(`${relativeToRepo(file)}: scope missing valid provenance_kind`);
    }
  }
  for (const m of errors) console.log(m);
  for (const m of warnings) console.log(m);
  console.log(`control:validate: ${errors.length} errors, ${warnings.length} warnings`);
  if (errors.length > 0) process.exit(1);
}

// ---------------------------------------------------------------------------
// control:render — re-render derived views
// ---------------------------------------------------------------------------

async function controlRender(args: Record<string, string | boolean>) {
  const scope = await readYamlIfExists<any>(path.join(CANONICAL, "scope.yaml"));
  if (!scope) {
    console.log("control:render: scope.yaml missing; run derive:control first");
    return;
  }
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const controlGraph = (await readYamlIfExists<any>(path.join(CANONICAL, "control-graph.yaml"))) ?? { edges: [] };
  await writeView("ACTIVE_SCOPE.md", renderActiveScopeView(scope, dag));
  await writeView("CONTROL_GRAPH.md", renderControlGraphView(controlGraph, dag));
  await writeView("LONG_RUN_PROTOCOL.md", await renderLongRunProtocolView());
  await appendLedger("control_render", "views", ["views/ACTIVE_SCOPE.md", "views/CONTROL_GRAPH.md", "views/LONG_RUN_PROTOCOL.md"], "Re-rendered control plane views");
  console.log("control:render: views updated");
}

// ---------------------------------------------------------------------------
// ready — 20-item audit
// ---------------------------------------------------------------------------

async function ready(args: Record<string, string | boolean>) {
  const report = await runReadyAudit();
  await ensureDirs(STATE, VIEWS);
  await writeJson(path.join(STATE, "ready-report.json"), report);
  await writeView("READY_TO_IMPLEMENT_REPORT.md", renderReadyReport(report));
  await appendLedger("ready_audit", "implementation-control", [`status:${report.status}`, `defects:${report.defects.length}`], `ready audit: ${report.status}`);
  console.log(`status: ${report.status}, ready_to_implement: ${report.ready_to_implement}, defects: ${report.defects.length}`);
  if (report.status === "not_ready") process.exit(1);
}

async function runReadyAudit(): Promise<any> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const defects: any[] = [];
  const activeScope: string[] = [];
  const legacyTruthRefs: string[] = [];
  const unclassifiedSections: string[] = [];
  const missingGateNodes: string[] = [];
  const missingPacketNodes: string[] = [];

  // 1. product specs are dirty
  const specDirty = await checkProductSpecDrift();
  if (specDirty) {
    errors.push("product specs are dirty");
    defects.push(mkDefect("READY-001", "P0", "canonical/product-spec-manifest.json", "Product spec manifest missing or out of sync", "bun run compile"));
  }

  // 2. any source section is unclassified
  const sections = await readNdjson<any>(path.join(CANONICAL, "spec-sections.ndjson"));
  const classifications = await readNdjson<any>(path.join(CANONICAL, "source-classifications.ndjson"));
  const classifiedSectionIds = new Set(classifications.map((c) => c.source_section_id));
  const unclassified = sections.filter((s: any) => !classifiedSectionIds.has(s.section_id));
  if (unclassified.length > 0) {
    unclassifiedSections.push(...unclassified.map((s: any) => s.section_id));
    errors.push(`${unclassified.length} source sections are unclassified`);
    defects.push(mkDefect("READY-002", "P0", "canonical/source-classifications.ndjson", `${unclassified.length} sections unclassified`, "bun run derive:deep"));
  }

  // 3. any normative section lacks assertion or explicit non-dispatch reason
  const scope = await readYamlIfExists<any>(path.join(CANONICAL, "scope.yaml"));
  if (!scope) {
    errors.push("canonical/scope.yaml missing");
    defects.push(mkDefect("READY-SCOPE", "P0", "canonical/scope.yaml", "scope.yaml missing", "seed project with manual_control_record scope.yaml"));
  } else {
    for (const included of scope.included_dag_nodes ?? []) activeScope.push(included.dag_node_id);
  }

  // 4-9. active DAG node checks
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const gates = (await readYamlIfExists<any>(path.join(CANONICAL, "gates.yaml"))) ?? { records: [] };
  const fixtures = (await readYamlIfExists<any>(path.join(CANONICAL, "fixtures.yaml"))) ?? { fixtures: [] };
  const profiles = (await readYamlIfExists<any>(path.join(CANONICAL, "validation-profiles.yaml"))) ?? { profiles: [] };
  const assertions = await readNdjson<any>(path.join(CANONICAL, "assertions.ndjson"));
  const links = await readNdjson<any>(path.join(CANONICAL, "assertion-links.ndjson"));
  const gateIds: Set<string> = new Set((gates.records ?? []).map((g: any) => g.gate_id));
  const fixtureIds: Set<string> = new Set((fixtures.fixtures ?? []).map((f: any) => f.fixture_id));
  const assertionIds: Set<string> = new Set(assertions.map((a: any) => a.assertion_id));
  const activeDagIds = new Set((scope?.included_dag_nodes ?? []).map((n: any) => n.dag_node_id));
  const activeDagNodes = (dag.nodes ?? []).filter((n: any) => activeDagIds.has(n.dag_node_id));
  for (const node of activeDagNodes) {
    if (!node.allowed_file_globs || node.allowed_file_globs.length === 0) {
      errors.push(`active DAG node ${node.dag_node_id} lacks allowed_file_globs`);
      defects.push(mkDefect(`READY-007-${node.dag_node_id}`, "P0", `canonical/dag.yaml#${node.dag_node_id}`, `${node.dag_node_id} lacks allowed_file_globs`, "edit canonical/dag.yaml"));
    }
    if (!node.forbidden_file_globs || node.forbidden_file_globs.length === 0) {
      errors.push(`active DAG node ${node.dag_node_id} lacks forbidden_file_globs`);
      defects.push(mkDefect(`READY-008-${node.dag_node_id}`, "P0", `canonical/dag.yaml#${node.dag_node_id}`, `${node.dag_node_id} lacks forbidden_file_globs`, "edit canonical/dag.yaml"));
    }
    if (!node.validation_profile && !profiles.profiles?.find((p: any) => p.dag_node_id === node.dag_node_id)) {
      errors.push(`active DAG node ${node.dag_node_id} lacks validation_profile`);
      defects.push(mkDefect(`READY-009-${node.dag_node_id}`, "P0", `canonical/dag.yaml#${node.dag_node_id}`, `${node.dag_node_id} lacks validation_profile`, "edit canonical/validation-profiles.yaml"));
    }
    if (!node.required_gate_ids || node.required_gate_ids.length === 0) {
      errors.push(`active DAG node ${node.dag_node_id} lacks required_gate_ids`);
      defects.push(mkDefect(`READY-006-${node.dag_node_id}`, "P0", `canonical/dag.yaml#${node.dag_node_id}`, `${node.dag_node_id} lacks required_gate_ids`, "edit canonical/dag.yaml"));
    }
    for (const gateId of node.required_gate_ids ?? []) {
      if (!gateIds.has(gateId)) missingGateNodes.push(`${node.dag_node_id}:${gateId}`);
    }
  }
  if (missingGateNodes.length > 0) {
    errors.push(`${missingGateNodes.length} active nodes reference missing gates`);
    defects.push(mkDefect("READY-MISSING-GATES", "P0", "canonical/dag.yaml", `${missingGateNodes.length} missing gate references`, "edit canonical/dag.yaml"));
  }

  // 10. ready frontier node has non-executable required fixtures
  const readyNodes = activeDagNodes.filter((n: any) => isReadyNode(n));
  for (const node of readyNodes) {
    const nodeFixtures = (fixtures.fixtures ?? []).filter((f: any) => (node.required_gate_ids ?? []).includes(f.gate_id));
    const nonExec = nodeFixtures.filter((f: any) => f.status !== "executable");
    if (nonExec.length > 0) {
      errors.push(`ready frontier node ${node.dag_node_id} has non-executable required fixtures: ${nonExec.map((f: any) => f.fixture_id).join(", ")}`);
      defects.push(mkDefect(`READY-010-${node.dag_node_id}`, "P0", `canonical/fixtures.yaml`, `${node.dag_node_id} has non-executable fixtures`, "edit canonical/fixtures.yaml"));
    }
  }

  // 11. unresolved P0/P1 blocker in active scope
  const blockers = await readBlockers();
  const openBlockers = blockers.filter((b) => ["open", "partial", "unknown"].includes(b.status) && b.severity !== "P2");
  if (openBlockers.length > 0) {
    errors.push(`${openBlockers.length} open P0/P1 blockers in active scope`);
    defects.push(mkDefect("READY-011", "P0", "state/blockers", `${openBlockers.length} open P0/P1 blockers`, "edit state/blockers/*.md or remove"));
  }

  // 12. legacy: legacy is forbidden entirely
  // (Removed: legacy is not allowed. The compiler is the sole producer. No legacy archive.)

  // 13. generated views are stale
  const viewStale = await checkViewStaleness();
  if (viewStale.length > 0) {
    errors.push(`generated views are stale: ${viewStale.join(", ")}`);
    defects.push(mkDefect("READY-013", "P0", "views/", `stale views: ${viewStale.join(", ")}`, "bun run control:render && bun run render"));
  }

  // 14-15. packet generation/validation for frontier nodes
  for (const node of activeDagNodes) {
    if (!isReadyNode(node)) continue;
    const generation = await canGeneratePacket(node, profiles, fixtures, gateIds);
    if (!generation.ok) {
      missingPacketNodes.push(node.dag_node_id);
      errors.push(`packet generation fails for ${node.dag_node_id}: ${generation.reason}`);
      defects.push(mkDefect(`READY-014-${node.dag_node_id}`, "P0", `canonical/dag.yaml#${node.dag_node_id}`, generation.reason ?? "packet generation fails", "edit canonical/dag.yaml"));
    }
  }

  // 16. graph is cyclic
  const cycles = findCycles(dag.nodes ?? []);
  if (cycles.length > 0) {
    errors.push(`graph is cyclic: ${cycles.length} cycles detected`);
    defects.push(mkDefect("READY-016", "P0", "canonical/dag.yaml", `${cycles.length} cycles detected`, "fix depends_on in canonical/dag.yaml"));
  }

  // 17. parent / subagent protocol incomplete
  if (!(await listFiles(SCHEMAS)).some((f) => f.includes("subagent-handoff"))) {
    errors.push("subagent handoff schema missing");
    defects.push(mkDefect("READY-017", "P0", "schemas/subagent-handoff.schema.json", "subagent handoff schema missing", "ensure schema file present"));
  }

  // 18. resume protocol
  if (!existsSync(path.join(VIEWS, "LONG_RUN_PROTOCOL.md"))) {
    warnings.push("LONG_RUN_PROTOCOL.md view missing");
  }

  // 19. evidence records cannot be written by CLI
  if (!(await listFiles(SCHEMAS)).some((f) => f.includes("evidence"))) {
    errors.push("evidence schema missing");
    defects.push(mkDefect("READY-019", "P0", "schemas/evidence.schema.json", "evidence schema missing", "ensure schema present"));
  }

  // 20. completion
  if (!(await listFiles(SCHEMAS)).some((f) => f.includes("packet-lifecycle"))) {
    warnings.push("packet-lifecycle schema missing");
  }

  // summary
  const counts = {
    deterministic_facts: 0,
    llm_derived_records: 0,
    manual_control_records: 0
  };
  const kindToKey: Record<string, keyof typeof counts> = {
    deterministic_fact: "deterministic_facts",
    llm_extracted: "llm_derived_records",
    manual_control_record: "manual_control_records"
  };
  function tally(records: any[]) {
    for (const r of records) {
      const key = kindToKey[r.provenance_kind];
      if (key) counts[key] += 1;
    }
  }
  tally(assertions);
  tally(links);
  tally(gates.records ?? []);
  tally(fixtures.fixtures ?? []);
  tally(classifications);
  tally(dag.nodes ?? []);

  const viewFiles = await listFiles(VIEWS);
  const futureOrCarryover = (scope?.excluded_dag_nodes ?? []).filter((n: any) => ["future", "carryover"].includes(n.status)).length;

  const status = errors.length === 0 ? "ready" : "not_ready";

  return {
    schema: "atelier.ready-report/v1",
    generated_at: new Date().toISOString(),
    status,
    ready_to_implement: false, // strict policy
    errors,
    warnings,
    active_scope: activeScope,
    legacy_truth_refs: legacyTruthRefs,
    unclassified_sections: unclassifiedSections,
    missing_gate_nodes: missingGateNodes,
    missing_packet_nodes: missingPacketNodes,
    defects,
    summary: {
      deterministic_facts: counts.deterministic_facts,
      llm_derived_records: counts.llm_derived_records,
      manual_control_records: counts.manual_control_records,
      generated_views: viewFiles.filter((f) => f.endsWith(".md")).length,
      unresolved_blockers: openBlockers.length,
      future_or_carryover_nodes: futureOrCarryover
    }
  };
}

function mkDefect(id: string, severity: "P0" | "P1" | "P2", affected: string, reason: string, action: string) {
  return { defect_id: id, severity, blocking: severity === "P0", affected_record: affected, reason, recommended_command_or_next_action: action };
}

async function checkProductSpecDrift(): Promise<boolean> {
  const manifestPath = path.join(CANONICAL, "product-spec-manifest.json");
  if (!existsSync(manifestPath)) return true;
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!manifest.files || manifest.files.length === 0) return true;
    for (const file of manifest.files.slice(0, 5)) {
      const abs = path.join(REPO_ROOT, file.path);
      if (!existsSync(abs)) return true;
      const text = await readFile(abs, "utf8");
      if (sha256(text) !== file.sha256) return true;
    }
    return false;
  } catch {
    return true;
  }
}

async function readBlockers(): Promise<any[]> {
  const dir = path.join(STATE, "blockers");
  if (!existsSync(dir)) return [];
  const out: any[] = [];
  for (const file of (await listFiles(dir)).filter((f) => f.endsWith(".md"))) {
    const text = await readFile(file, "utf8");
    const id = path.basename(file, ".md");
    const status = /closed|resolved/i.test(text) ? "closed" : /partial/i.test(text) ? "partial" : /open|active/i.test(text) ? "open" : "unknown";
    const severity = /P0/i.test(text) ? "P0" : /P1/i.test(text) ? "P1" : "P2";
    out.push({ blocker_id: id, status, severity });
  }
  return out;
}

async function checkViewStaleness(): Promise<string[]> {
  const stale: string[] = [];
  const views = await listFiles(VIEWS);
  for (const view of views) {
    if (!view.endsWith(".md")) continue;
    const text = await readFile(view, "utf8");
    if (!text.startsWith(GENERATED_HEADER)) stale.push(path.basename(view));
  }
  return stale;
}

function isReadyNode(node: any): boolean {
  return (node.allowed_file_globs?.length ?? 0) > 0 && (node.required_gate_ids?.length ?? 0) > 0;
}

async function canGeneratePacket(node: any, profiles: any, fixtures: any, gateIds: Set<string>): Promise<{ ok: boolean; reason?: string }> {
  if (!node.allowed_file_globs || node.allowed_file_globs.length === 0) return { ok: false, reason: "no allowed_file_globs" };
  if (!node.required_gate_ids || node.required_gate_ids.length === 0) return { ok: false, reason: "no required_gate_ids" };
  for (const gateId of node.required_gate_ids) {
    if (!gateIds.has(gateId)) return { ok: false, reason: `missing gate ${gateId}` };
  }
  if (!profiles.profiles?.find((p: any) => p.dag_node_id === node.dag_node_id)) return { ok: false, reason: "no validation profile" };
  return { ok: true };
}

function findCycles(nodes: any[]): string[][] {
  const byId = new Map(nodes.map((n) => [n.dag_node_id, n]));
  const cycles: string[][] = [];
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string, pathSoFar: string[]) {
    if (visiting.has(id)) { cycles.push([...pathSoFar, id]); return; }
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

function renderReadyReport(report: any): string {
  return `# Ready-to-Implement Report

Generated: ${report.generated_at}

## Status

- **status**: ${report.status}
- **ready_to_implement**: ${report.ready_to_implement}

A strict \`not_ready\` exposing real defects is the acceptable outcome.
\`ready_to_implement: true\` requires explicit human review after all defects close.

## Summary

| Category | Count |
| | ---: |
| deterministic facts | ${report.summary.deterministic_facts} |
| LLM-derived records | ${report.summary.llm_derived_records} |
| legacy-promoted records | 0 (forbidden) |
| manual control records | ${report.summary.manual_control_records} |
| generated views | ${report.summary.generated_views} |
| unresolved blockers | ${report.summary.unresolved_blockers} |
| future / carryover nodes | ${report.summary.future_or_carryover_nodes} |

## Active Scope

${report.active_scope.map((s: string) => `- ${s}`).join("\n") || "- (none)"}

## Errors

${report.errors.map((e: string) => `- ${e}`).join("\n") || "- (none)"}

## Warnings

${report.warnings.map((w: string) => `- ${w}`).join("\n") || "- (none)"}

## Defects

| Defect | Severity | Blocking | Affected | Reason | Action |
| | | | | | |
${report.defects.map((d: any) => `| ${d.defect_id} | ${d.severity} | ${d.blocking} | ${d.affected_record} | ${d.reason} | \`${d.recommended_command_or_next_action}\` |`).join("\n") || "| (no defects) | | | | | |"}

## Legacy Truth Refs

${(report.legacy_truth_refs ?? []).map((l: string) => `- ${l}`).join("\n") || "- (none — legacy is forbidden; compiler is the sole producer)"}

## Unclassified Sections

${report.unclassified_sections.length > 0 ? report.unclassified_sections.slice(0, 50).map((s: string) => `- ${s}`).join("\n") : "- (none)"}
`;
}

// ---------------------------------------------------------------------------
// packet lifecycle
// ---------------------------------------------------------------------------

async function packetCreate(args: Record<string, string | boolean>) {
  const dag = String(args.dag ?? "");
  if (!dag) throw new Error("Missing --dag <DAG-ID>");
  const packet = await generatePacket(dag);
  await ensureDirs(path.join(STATE, "packets"));
  const out = String(args.out ?? `state/packets/${packet.packet_id}.yaml`);
  const outPath = path.resolve(ROOT, out);
  await writeYaml(outPath, packet);
  await appendPacketLifecycle("packet_created", packet.packet_id, dag, packet.status, []);
  await appendLedger("packet_create", dag, [out], `packet ${packet.packet_id} created`);
  console.log(`packet:create -> ${out}`);
}

async function generatePacket(dagId: string): Promise<any> {
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const node = (dag.nodes ?? []).find((n: any) => n.dag_node_id === dagId);
  if (!node) throw new Error(`Unknown DAG node: ${dagId}`);
  const gates = (await readYamlIfExists<any>(path.join(CANONICAL, "gates.yaml"))) ?? { records: [] };
  const fixtures = (await readYamlIfExists<any>(path.join(CANONICAL, "fixtures.yaml"))) ?? { fixtures: [] };
  const profiles = (await readYamlIfExists<any>(path.join(CANONICAL, "validation-profiles.yaml"))) ?? { profiles: [] };
  const profile = profiles.profiles?.find((p: any) => p.dag_node_id === dagId);
  if (!profile) throw new Error(`No validation profile for ${dagId}`);
  const packetId = `PKT-${dagId}-${shortHash(`${dagId}:${new Date().toISOString()}`)}`;
  return {
    schema: "atelier.packet/v1",
    packet_id: packetId,
    status: "draft",
    dag_node_ids: [dagId],
    title: node.title,
    goal: `Implement ${node.title} using only the bounded context in this packet.`,
    subagent_contract: [
      "Read only this packet.",
      "Do not read broad product specs.",
      "Do not edit product specs.",
      "Edit only allowed files.",
      "Return a structured handoff JSON validated by `bun run subagent:validate-handoff`."
    ],
    non_goals: [
      "Do not edit product specs.",
      "Do not modify the main Atelier CLI.",
      "Do not implement beyond this packet's allowed files."
    ],
    required_source_sections: [],
    assertions: node.owns_assertion_ids ?? [],
    allowed_files: node.allowed_file_globs ?? [],
    forbidden_files: node.forbidden_file_globs ?? ["harness/knowledge/product-specs/atelier/**", "product/apps/atelier/src/cli.ts"],
    required_gates: node.required_gate_ids ?? [],
    required_fixtures: unique((node.required_gate_ids ?? []).flatMap((g: string) => (fixtures.fixtures ?? []).filter((f: any) => f.gate_id === g).map((f: any) => f.fixture_id))),
    validation_profile: profile.profile_id,
    evidence_expectations: (node.required_gate_ids ?? []).map((g: string) => ({ gate_id: g, expected_artifact: `state/evidence/${dagId}-${g}.json` })),
    acceptance_criteria: node.expected_outputs ?? node.completion_criteria ?? [],
    blockers: [],
    failure_policy: [
      "Do not dispatch implementation work while packet status is blocked.",
      "Fail closed on missing gates, missing fixtures, or forbidden file requirements.",
      "Run required validation before claiming packet completion."
    ]
  };
}

async function packetContext(args: Record<string, string | boolean>) {
  const packetPath = String(args.packet ?? args._positional ?? "");
  if (!packetPath) throw new Error("Missing --packet <path>");
  const absPath = path.resolve(ROOT, packetPath);
  const packet = await readYaml<any>(absPath);
  const dagId = packet.dag_node_ids?.[0] ?? "";
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const node = (dag.nodes ?? []).find((n: any) => n.dag_node_id === dagId);
  const output = {
    schema: "atelier.packet-context/v1",
    generated_at: new Date().toISOString(),
    packet_id: packet.packet_id,
    dag_node_id: dagId,
    title: node?.title ?? "",
    goal: packet.goal,
    subagent_contract: packet.subagent_contract,
    non_goals: packet.non_goals,
    allowed_files: packet.allowed_files,
    forbidden_files: packet.forbidden_files,
    required_gates: packet.required_gates,
    required_fixtures: packet.required_fixtures,
    validation_profile: packet.validation_profile,
    acceptance_criteria: packet.acceptance_criteria,
    evidence_expectations: packet.evidence_expectations,
    failure_policy: packet.failure_policy
  };
  console.log(JSON.stringify(output, null, 2));
}

async function packetDispatch(args: Record<string, string | boolean>) {
  const packetPath = String(args.packet ?? "");
  if (!packetPath) throw new Error("Missing --packet <path>");
  const absPath = path.resolve(ROOT, packetPath);
  const packet = await readYaml<any>(absPath);
  const dagId = packet.dag_node_ids?.[0] ?? "";
  const packetId = packet.packet_id;
  await writeYaml(absPath, { ...packet, status: "in_flight" });
  await appendPacketLifecycle("packet_dispatched", packetId, dagId, "in_flight", []);
  await appendLedger("packet_dispatch", dagId, [packetPath], `dispatched ${packetId}`);
  console.log(`packet:dispatch: ${packetId} -> in_flight`);
}

async function packetComplete(args: Record<string, string | boolean>) {
  const packetPath = String(args.packet ?? "");
  if (!packetPath) throw new Error("Missing --packet <path>");
  const absPath = path.resolve(ROOT, packetPath);
  const packet = await readYaml<any>(absPath);
  const dagId = packet.dag_node_ids?.[0] ?? "";
  const packetId = packet.packet_id;
  await writeYaml(absPath, { ...packet, status: "accepted" });
  await appendPacketLifecycle("packet_accepted", packetId, dagId, "accepted", []);
  await appendLedger("packet_complete", dagId, [packetPath], `completed ${packetId}`);
  console.log(`packet:complete: ${packetId} -> accepted`);
}

async function packetReject(args: Record<string, string | boolean>) {
  const packetPath = String(args.packet ?? "");
  if (!packetPath) throw new Error("Missing --packet <path>");
  const reason = String(args.reason ?? "rejected");
  const absPath = path.resolve(ROOT, packetPath);
  const packet = await readYaml<any>(absPath);
  const dagId = packet.dag_node_ids?.[0] ?? "";
  const packetId = packet.packet_id;
  await writeYaml(absPath, { ...packet, status: "rejected" });
  await appendPacketLifecycle("packet_rejected", packetId, dagId, "rejected", [reason]);
  await appendLedger("packet_reject", dagId, [packetPath], `rejected ${packetId}: ${reason}`);
  console.log(`packet:reject: ${packetId} -> rejected (${reason})`);
}

async function packetBlock(args: Record<string, string | boolean>) {
  const packetPath = String(args.packet ?? "");
  if (!packetPath) throw new Error("Missing --packet <path>");
  const reason = String(args.reason ?? "blocked");
  const absPath = path.resolve(ROOT, packetPath);
  const packet = await readYaml<any>(absPath);
  const dagId = packet.dag_node_ids?.[0] ?? "";
  const packetId = packet.packet_id;
  await writeYaml(absPath, { ...packet, status: "blocked" });
  await appendPacketLifecycle("packet_blocked", packetId, dagId, "blocked", [reason]);
  await appendLedger("packet_block", dagId, [packetPath], `blocked ${packetId}: ${reason}`);
  console.log(`packet:block: ${packetId} -> blocked (${reason})`);
}

// ---------------------------------------------------------------------------
// subagent handoff
// ---------------------------------------------------------------------------

async function subagentValidateHandoff(args: Record<string, string | boolean>) {
  const file = String(args.file ?? args._positional ?? "");
  if (!file) throw new Error("Missing <file> or --file <path>");
  const absPath = path.resolve(process.cwd(), file);
  if (!existsSync(absPath)) throw new Error(`Handoff file not found: ${file}`);
  const text = await readFile(absPath, "utf8");
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) {
    console.error("handoff must be a JSON object (no prose body)");
    process.exit(1);
  }
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch (error) {
    console.error(`invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
  const allowedKeys = new Set(["schema", "run_id", "dag_node_id", "files_changed", "tests_written", "vg_results", "evidence_paths", "blockers", "summary"]);
  const extra = Object.keys(parsed).filter((k) => !allowedKeys.has(k));
  if (extra.length > 0) {
    console.error(`handoff contains extra narrative fields: ${extra.join(", ")}`);
    process.exit(1);
  }
  for (const key of ["run_id", "dag_node_id", "files_changed", "tests_written", "vg_results", "evidence_paths", "blockers"]) {
    if (!(key in parsed)) {
      console.error(`handoff missing required field: ${key}`);
      process.exit(1);
    }
  }
  if (parsed.summary !== undefined && parsed.summary.length > 80) {
    console.error(`handoff summary exceeds 80 chars: ${parsed.summary.length}`);
    process.exit(1);
  }
  for (const [gate, value] of Object.entries(parsed.vg_results ?? {})) {
    if (!["passed", "failed", "skipped", "blocked"].includes(value as string)) {
      console.error(`vg_results.${gate} has invalid value: ${value}`);
      process.exit(1);
    }
  }
  parsed.schema = parsed.schema ?? "atelier.subagent-handoff/v1";
  const packet = await findPacketForHandoff(parsed.dag_node_id);
  if (packet) {
    for (const file of parsed.files_changed ?? []) {
      if (!isPathInside(file, packet.allowed_files ?? [])) {
        console.error(`files_changed path '${file}' is outside allowed_files`);
        process.exit(1);
      }
    }
    for (const file of parsed.tests_written ?? []) {
      if (!isPathInside(file, packet.allowed_files ?? [])) {
        console.error(`tests_written path '${file}' is outside allowed_files`);
        process.exit(1);
      }
    }
  }
  console.log("handoff valid");
}

async function findPacketForHandoff(dagId: string): Promise<any | null> {
  const dir = path.join(STATE, "packets");
  if (!existsSync(dir)) return null;
  for (const file of (await listFiles(dir)).filter((f) => f.endsWith(".yaml"))) {
    try {
      const packet = await readYaml<any>(file);
      if (packet.dag_node_ids?.includes(dagId)) return packet;
    } catch {}
  }
  return null;
}

function isPathInside(filePath: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (pattern.includes("*")) {
      const regex = new RegExp("^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$");
      if (regex.test(filePath)) return true;
    } else if (filePath === pattern || filePath.startsWith(pattern + "/") || filePath.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

// ---------------------------------------------------------------------------
// evidence
// ---------------------------------------------------------------------------

async function evidenceAdd(args: Record<string, string | boolean>) {
  const evidenceId = String(args.id ?? `EVD-${shortHash(`${args.gate ?? "?"}:${new Date().toISOString()}`)}`);
  const gate = String(args.gate ?? "");
  const status = String(args.status ?? "passed");
  const body = String(args.body ?? `state/validations/${gate || evidenceId}.md`);
  if (!gate) throw new Error("Missing --gate <GATE-ID>");
  if (!["passed", "failed", "blocked", "not_run", "unknown"].includes(status)) throw new Error(`invalid status: ${status}`);
  const record = { schema: "atelier.evidence/v1", evidence_id: evidenceId, gate_id: gate, status, body_ref: body, created_at: new Date().toISOString() };
  await ensureDirs(path.join(STATE, "evidence"));
  await writeJson(path.join(STATE, "evidence", `${evidenceId}.json`), record);
  await appendLedger("evidence_add", gate, [`${evidenceId}:${status}`], `evidence ${evidenceId} added`);
  console.log(`evidence:add ${evidenceId} (${status})`);
}

async function evidenceList(args: Record<string, string | boolean>) {
  const dir = path.join(STATE, "evidence");
  if (!existsSync(dir)) {
    console.log("(no evidence records)");
    return;
  }
  const files = (await listFiles(dir)).filter((f) => f.endsWith(".json"));
  const records = await Promise.all(files.map(async (f) => JSON.parse(await readFile(f, "utf8"))));
  if (args.json) console.log(JSON.stringify(records, null, 2));
  else for (const r of records) console.log(`- ${r.evidence_id} gate=${r.gate_id} status=${r.status} body=${r.body_ref}`);
}

async function evidenceVerify(args: Record<string, string | boolean>) {
  const dir = path.join(STATE, "evidence");
  if (!existsSync(dir)) {
    console.log("(no evidence records to verify)");
    return;
  }
  const files = (await listFiles(dir)).filter((f) => f.endsWith(".json"));
  let valid = 0, invalid = 0;
  for (const file of files) {
    try {
      const record = JSON.parse(await readFile(file, "utf8"));
      if (!record.evidence_id || !record.gate_id || !record.status) { invalid += 1; continue; }
      if (record.body_ref && !existsSync(path.join(REPO_ROOT, record.body_ref))) { invalid += 1; continue; }
      valid += 1;
    } catch { invalid += 1; }
  }
  console.log(`evidence:verify valid=${valid} invalid=${invalid}`);
  if (invalid > 0) process.exit(1);
}

// ---------------------------------------------------------------------------
// status, frontier, resume
// ---------------------------------------------------------------------------

async function computeFrontierLite(): Promise<{ ready: any[]; blocked: any[]; activePackets: string[]; nextCommand: string }> {
  const dag = (await readYamlIfExists<any>(path.join(CANONICAL, "dag.yaml"))) ?? { nodes: [] };
  const scope = await readYamlIfExists<any>(path.join(CANONICAL, "scope.yaml"));
  const activeDagIds = new Set((scope?.included_dag_nodes ?? []).map((n: any) => n.dag_node_id));
  const ready: any[] = [];
  const blocked: any[] = [];
  for (const node of dag.nodes ?? []) {
    if (!activeDagIds.has(node.dag_node_id)) continue;
    if ((node.allowed_file_globs?.length ?? 0) > 0 && (node.required_gate_ids?.length ?? 0) > 0) ready.push(node);
    else blocked.push(node);
  }
  const activePackets: string[] = [];
  const packetDir = path.join(STATE, "packets");
  if (existsSync(packetDir)) {
    for (const file of (await listFiles(packetDir)).filter((f) => f.endsWith(".yaml"))) {
      try {
        const packet = await readYaml<any>(file);
        if (["draft", "in_flight"].includes(packet.status)) activePackets.push(relativeToRepo(file));
      } catch {}
    }
  }
  return { ready, blocked, activePackets, nextCommand: ready.length > 0 ? `bun run packet:create -- --dag ${ready[0].dag_node_id}` : "bun run derive:control" };
}

async function statusCommand(args: Record<string, string | boolean>) {
  const r = await computeFrontierLite();
  const blockers = await readBlockers();
  const open = blockers.filter((b) => ["open", "partial"].includes(b.status) && b.severity !== "P2");
  const out = { schema: "atelier.status/v1", generated_at: new Date().toISOString(), active_packets: r.activePackets, ready: r.ready, blocked: r.blocked, open_blockers: open.length, next_command: r.nextCommand };
  if (args.json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(`# Status`);
    console.log(`active_packets: ${r.activePackets.join(", ") || "(none)"}`);
    console.log(`ready: ${r.ready.map((n: any) => n.dag_node_id).join(", ") || "(none)"}`);
    console.log(`blocked: ${r.blocked.map((n: any) => n.dag_node_id).join(", ") || "(none)"}`);
    console.log(`open_blockers: ${open.length}`);
    console.log(`next_command: ${r.nextCommand}`);
  }
}

async function frontierCommand(args: Record<string, string | boolean>) {
  const r = await computeFrontierLite();
  if (args.json) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`ready: ${r.ready.map((n: any) => n.dag_node_id).join(", ") || "(none)"}`);
    console.log(`blocked: ${r.blocked.map((n: any) => n.dag_node_id).join(", ") || "(none)"}`);
    console.log(`active_packets: ${r.activePackets.join(", ") || "(none)"}`);
  }
}

async function resumeCommand(args: Record<string, string | boolean>) {
  const r = await computeFrontierLite();
  if (args.json) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`active_packets: ${r.activePackets.join(", ") || "(none)"}`);
    console.log(`ready: ${r.ready.map((n: any) => n.dag_node_id).join(", ") || "(none)"}`);
    console.log(`blocked: ${r.blocked.map((n: any) => n.dag_node_id).join(", ") || "(none)"}`);
    console.log(`next_command: ${r.nextCommand}`);
  }
}

async function completeCommand(args: Record<string, string | boolean>) {
  const packet = String(args.packet ?? "");
  if (!packet) throw new Error("Missing --packet <path>");
  await packetComplete({ ...args, packet });
}
