import { promises as fs, existsSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import pm from "picomatch";

const hasMeaningfulText = (text: string) => text.trim().length > 0;

const FrontmatterSchema = z.union([
  // Harness format
  z.object({
    name: z.string().min(1, "name is required"),
    description: z.string().refine(hasMeaningfulText, "description is required"),
    summary: z.string().refine(hasMeaningfulText, "summary is required").optional(),
    read_when: z.array(z.string().refine(hasMeaningfulText, "read_when items must be non-empty")),
    skip_when: z.array(z.string().refine(hasMeaningfulText, "skip_when items must be non-empty")).optional(),
    "user-invocable": z.boolean().optional(),
    "execution-ready": z.boolean().optional(),
  }),
  // Rule format
  z.object({
    title: z.string().min(1, "title is required"),
    impact: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    impactDescription: z.string().optional(),
    tags: z.string().optional(),
  })
]);

const EXECUTION_READY_REQUIRED_SECTIONS = [
  "Goal",
  "Scope",
  "Deliverables",
  "Task Breakdown",
  "Subagent Contract",
  "Verification",
  "Completion Signal",
] as const;

const EXECUTION_READY_LIST_SECTIONS = [
  "Deliverables",
  "Subagent Contract",
  "Verification",
  "Completion Signal",
] as const;

const STALE_TAXONOMY_PATTERNS = [
  { label: "docs/harness", pattern: /docs\/harness\b/ },
  { label: "context.md", pattern: /\bcontext\.md\b/ },
  { label: "structure.md", pattern: /\bstructure\.md\b/ },
  { label: "guard.md", pattern: /\bguard\.md\b/ },
  { label: "tools.md", pattern: /\btools\.md\b/ },
] as const;

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const res = path.resolve(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(res);
    } else {
      yield res;
    }
  }
}

async function validateFrontmatter(filepath: string): Promise<boolean> {
  const content = await fs.readFile(filepath, "utf-8");
  let data;
  try {
    const parsed = matter(content);
    data = parsed.data;
  } catch (err: any) {
    console.error(`\x1b[31m[ERROR]\x1b[0m YAML Parsing failed in: ${path.relative(process.cwd(), filepath)}`);
    console.error(`  - ${err.message}`);
    return false;
  }

  if (Object.keys(data).length === 0) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Missing mandatory frontmatter in: ${path.relative(process.cwd(), filepath)}`);
    return false;
  }

  const result = FrontmatterSchema.safeParse(data);
  if (!result.success) {
    console.error(`\x1b[31m[ERROR]\x1b[0m Frontmatter validation failed in: ${path.relative(process.cwd(), filepath)}`);
    for (const issue of result.error.issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
    return false;
  }
  return true;
}

function getSectionBody(content: string, heading: string): string | null {
  const lines = content.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);

  if (startIndex === -1) {
    return null;
  }

  const bodyLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.startsWith("## ")) {
      break;
    }
    bodyLines.push(line);
  }

  return bodyLines.join("\n").trim();
}

async function validateExecutionReadyPlan(filepath: string, content: string): Promise<boolean> {
  if (!filepath.includes(`${path.sep}docs${path.sep}exec-plans${path.sep}active${path.sep}`)) {
    return true;
  }

  const { data } = matter(content);
  if (data["execution-ready"] !== true) {
    return true;
  }

  let isValid = true;

  for (const heading of EXECUTION_READY_REQUIRED_SECTIONS) {
    const body = getSectionBody(content, heading);
    if (!body) {
      console.error(
        `\x1b[31m[ERROR]\x1b[0m execution-ready plan is missing '## ${heading}' in ${path.relative(process.cwd(), filepath)}`,
      );
      isValid = false;
    }
  }

  for (const heading of EXECUTION_READY_LIST_SECTIONS) {
    const body = getSectionBody(content, heading);
    if (!body) continue;

    const hasBullet = body
      .split("\n")
      .some((line) => line.trim().startsWith("- ") || line.trim().startsWith("* "));

    if (!hasBullet) {
      console.error(
        `\x1b[31m[ERROR]\x1b[0m execution-ready section '## ${heading}' must contain at least one bullet in ${path.relative(process.cwd(), filepath)}`,
      );
      isValid = false;
    }
  }

  return isValid;
}

async function checkFreshness(filepath: string): Promise<void> {
  const stats = await fs.stat(filepath);
  const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 30 * 6;
  if (stats.mtimeMs < sixMonthsAgo) {
    console.warn(`\x1b[33m[WARN]\x1b[0m Stale document (> 6 months): ${path.relative(process.cwd(), filepath)}`);
  }
}

function shouldLintTaxonomy(filepath: string): boolean {
  const relative = path.relative(process.cwd(), filepath);
  return (
    relative === "AGENTS.md" ||
    relative === "docs/ARCHITECTURE.md" ||
    relative === "docs/GUARDRAILS.md" ||
    relative.startsWith(`docs${path.sep}workflows${path.sep}`)
  );
}

async function validateTaxonomyVocabulary(filepath: string, content: string): Promise<boolean> {
  if (!shouldLintTaxonomy(filepath)) {
    return true;
  }

  let isValid = true;

  for (const { label, pattern } of STALE_TAXONOMY_PATTERNS) {
    if (pattern.test(content)) {
      console.error(
        `\x1b[31m[ERROR]\x1b[0m stale taxonomy reference '${label}' found in ${path.relative(process.cwd(), filepath)}`,
      );
      isValid = false;
    }
  }

  return isValid;
}

async function lintMarkdownContent(filepath: string, content: string): Promise<boolean> {
  let hasErrors = false;
  const lines = content.split("\n");
  
  // MD001: Header levels should only increment by one level at a time
  let lastHeaderLevel = 0;
  // MD031: Fenced code blocks should be surrounded by blank lines
  let inCodeBlock = false;
  // MD004: Unordered list style: consistent
  let listMarker: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // MD001 check
    const headerMatch = line.match(/^(#{1,6})\s/);
    if (headerMatch) {
      const currentLevel = headerMatch[1].length;
      if (currentLevel > lastHeaderLevel + 1) {
        console.error(`\x1b[31m[ERROR]\x1b[0m MD001: Header level skip (${lastHeaderLevel} -> ${currentLevel}) at line ${i + 1} in ${path.relative(process.cwd(), filepath)}`);
        hasErrors = true;
      }
      lastHeaderLevel = currentLevel;
    }

    // MD004 check
    const listMatch = line.match(/^\s*([\*\-])\s/);
    if (listMatch && !inCodeBlock) {
      const currentMarker = listMatch[1];
      if (listMarker === null) {
        listMarker = currentMarker;
      } else if (listMarker !== currentMarker) {
        console.error(`\x1b[31m[ERROR]\x1b[0m MD004: Inconsistent list marker (expected '${listMarker}', found '${currentMarker}') at line ${i + 1} in ${path.relative(process.cwd(), filepath)}`);
        hasErrors = true;
      }
    }

    // MD031 check
    if (line.trim().startsWith("```")) {
      if (!inCodeBlock) {
        // Starting code block
        if (i > 0 && lines[i-1].trim() !== "") {
          console.error(`\x1b[31m[ERROR]\x1b[0m MD031: Fenced code block starting at line ${i + 1} should be preceded by a blank line in ${path.relative(process.cwd(), filepath)}`);
          hasErrors = true;
        }
        inCodeBlock = true;
      } else {
        // Ending code block
        if (i < lines.length - 1 && lines[i+1].trim() !== "") {
          console.error(`\x1b[31m[ERROR]\x1b[0m MD031: Fenced code block ending at line ${i + 1} should be followed by a blank line in ${path.relative(process.cwd(), filepath)}`);
          hasErrors = true;
        }
        inCodeBlock = false;
      }
    }
  }

  return hasErrors;
}

async function validateReachability() {
  const agentsMd = path.resolve(process.cwd(), "AGENTS.md");
  const docsDir = path.resolve(process.cwd(), "docs");
  
  const allMdFiles = new Set<string>();
  allMdFiles.add(agentsMd);
  for (const dir of [docsDir]) {
    try {
      for await (const filepath of walk(dir)) {
        if (filepath.endsWith(".md")) {
          allMdFiles.add(filepath);
        }
      }
    } catch {
      // directory might not exist
    }
  }

  const reachedFiles = new Set<string>();
  const queue: string[] = [agentsMd];
  let hasErrors = false;

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (reachedFiles.has(current)) continue;
    reachedFiles.add(current);

    if (!current.endsWith(".md")) continue;

    let content;
    try {
      content = await fs.readFile(current, "utf-8");
    } catch {
      continue;
    }

    // Extract links: [text](link) or `/docs/...` in backticks
    const linkRegex = /\[.*?\]\((?!http)(.*?)\)|`(\/docs\/.*?)`/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      let linkPath = match[1] || match[2];
      if (!linkPath) continue;

      // strip hash fragments
      if (linkPath.includes('#')) {
        linkPath = linkPath.split('#')[0];
      }

      // Resolve path
      let absolutePath;
      if (linkPath.startsWith("/")) {
        absolutePath = path.resolve(process.cwd(), linkPath.slice(1));
      } else {
        absolutePath = path.resolve(path.dirname(current), linkPath);
        
        // Smart Path Resolution: if the resolved path doesn't exist, but it starts with ./docs/
        // OR if it's already in docs/ and the link looks root-relative (e.g., /docs/...)
        // though /docs/... would have been caught by the linkPath.startsWith("/") check above.
        if (!existsSync(linkPath.includes("*") ? path.dirname(absolutePath) : absolutePath)) {
            if (linkPath.startsWith("./docs/")) {
                const rootRel = path.resolve(process.cwd(), linkPath.slice(2));
                if (existsSync(linkPath.includes("*") ? path.dirname(rootRel) : rootRel)) {
                    absolutePath = rootRel;
                }
            }
        }
      }

      // Handle the case where someone writes [link](/docs/...) inside a doc.
      // Above logic already handles it by stripping the first char if it starts with /.
      // Wait, if linkPath is /docs/product-specs/*.md, it goes to the first 'if'.
      // path.resolve(process.cwd(), "docs/product-specs/*.md") should work.

      // Wildcard check
      if (linkPath.includes("*")) {
        const isRecursive = linkPath.includes("**");
        const baseDir = isRecursive 
            ? absolutePath.split("**")[0].replace(/\/$/, "")
            : path.dirname(absolutePath);
        const pattern = isRecursive
            ? linkPath.split("**").slice(1).join("**").replace(/^\//, "**") || "**/*.md"
            : path.basename(absolutePath);

        if (!existsSync(baseDir)) {
            console.error(`\x1b[31m[ERROR]\x1b[0m Directory not found for wildcard in ${path.relative(process.cwd(), current)} -> ${linkPath}`);
            hasErrors = true;
            continue;
        }

        try {
          const isMatch = pm(isRecursive ? `**/${pattern.replace(/^\*\*\//, "")}` : pattern);
          
          let matchedAny = false;
          const filesToCheck = isRecursive ? walk(baseDir) : (await fs.readdir(baseDir)).map(e => path.resolve(baseDir, e));

          for await (const fullPath of (isRecursive ? filesToCheck : (filesToCheck as string[]))) {
            const relToSubRoot = path.relative(baseDir, fullPath);
            if (isMatch(relToSubRoot)) {
              if (fullPath.endsWith(".md")) {
                queue.push(fullPath);
                reachedFiles.add(fullPath);
                matchedAny = true;
              }
            }
          }

          if (!matchedAny) {
            console.error(`\x1b[31m[ERROR]\x1b[0m No files matched wildcard in ${path.relative(process.cwd(), current)} -> ${linkPath}`);
            hasErrors = true;
          }
        } catch (e: any) {
          console.error(`\x1b[31m[ERROR]\x1b[0m Wildcard error in ${path.relative(process.cwd(), current)} -> ${linkPath}: ${e.message}`);
          hasErrors = true;
        }
        continue;
      }

      try {
        const stats = await fs.stat(absolutePath);
        if (stats.isDirectory()) {
          // If directory, reach all md files inside
          for await (const subFile of walk(absolutePath)) {
            if (subFile.endsWith(".md")) {
              reachedFiles.add(subFile);
              queue.push(subFile);
            }
          }
        } else {
          if (absolutePath.endsWith(".md")) {
            queue.push(absolutePath);
          }
        }
      } catch {
        console.error(`\x1b[31m[ERROR]\x1b[0m Broken link in ${path.relative(process.cwd(), current)} -> ${linkPath}`);
        hasErrors = true;
      }
    }
  }

  // Orphan Detection
  for (const file of allMdFiles) {
    const filename = path.basename(file);
    if (filename === "README.md" || filename === "_template.md") continue;

    if (!reachedFiles.has(file)) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Orphaned document (unreachable from AGENTS.md): ${path.relative(process.cwd(), file)}`);
      hasErrors = true;
    }
  }

  return hasErrors;
}

async function run() {
  const docsDir = path.resolve(process.cwd(), "docs");
  const agentsMd = path.resolve(process.cwd(), "AGENTS.md");
  let hasErrors = false;

  const filesToLint = [];
  for (const dir of [docsDir]) {
    try {
      for await (const filepath of walk(dir)) {
        if (filepath.endsWith(".md")) filesToLint.push(filepath);
      }
    } catch {
      // directory might not exist
    }
  }
  filesToLint.push(agentsMd);

  console.log("Linting docs frontmatter, freshness and basic content rules...");
  for (const filepath of filesToLint) {
    const filename = path.basename(filepath);
    const isAgents = filename === "AGENTS.md";
    const isExempt = filename === "README.md" || filename === "_template.md";

    if (isExempt) continue;

    // Frontmatter is mandatory for docs/ markdowns. AGENTS.md is exempt by convention.
    if (!isAgents) {
      const fmOk = await validateFrontmatter(filepath);
      if (!fmOk) hasErrors = true;
    }

    await checkFreshness(filepath);

    const content = await fs.readFile(filepath, "utf-8");
    const contentOk = await lintMarkdownContent(filepath, content);
    if (contentOk) hasErrors = true; // lintMarkdownContent returns true if errors found

    const taxonomyOk = await validateTaxonomyVocabulary(filepath, content);
    if (!taxonomyOk) hasErrors = true;

    if (!isAgents) {
      const executionReadyOk = await validateExecutionReadyPlan(filepath, content);
      if (!executionReadyOk) hasErrors = true;
    }
  }

  console.log("Linting reachability and orphan detection...");
  const reachabilityErrors = await validateReachability();
  if (reachabilityErrors) hasErrors = true;

  if (hasErrors) {
    console.error("\x1b[31mDoc linting failed.\x1b[0m");
    process.exit(1);
  }

  console.log("\x1b[32mAll docs lint checks passed!\x1b[0m");
}

run();
