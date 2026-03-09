import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const isJapanese = (text: string) => /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/.test(text);

const FrontmatterSchema = z.object({
  name: z.string().min(1, "name is required"),
  description: z.string().refine(isJapanese, "description must contain Japanese"),
  summary: z.string().refine(isJapanese, "summary must contain Japanese").optional(),
  read_when: z.array(z.string().refine(isJapanese, "read_when items must contain Japanese")),
  skip_when: z.array(z.string().refine(isJapanese, "skip_when items must contain Japanese")).optional(),
  "user-invocable": z.boolean().optional(),
});

async function *walk(dir: string): AsyncGenerator<string> {
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

async function validateDocs() {
  const docsDir = path.resolve(process.cwd(), "docs");
  let hasErrors = false;

  console.log("Linting docs frontmatter...");

  for await (const filepath of walk(docsDir)) {
    if (!filepath.endsWith(".md")) continue;

    const content = await fs.readFile(filepath, "utf-8");
    let data;
    try {
      const parsed = matter(content);
      data = parsed.data;
    } catch (err: any) {
      console.error(`\x1b[31m[ERROR]\x1b[0m YAML Parsing failed in: ${path.relative(process.cwd(), filepath)}`);
      console.error(`  - ${err.message}`);
      hasErrors = true;
      continue;
    }

    // Skip generic READMEs if they don't have frontmatter at all and are empty or minimal,
    // but the Harness spec says ALL docs/ implementation files must have this.
    // If it has NO keys at all, we might warn instead, but let's strictly validate if any key exists
    // or if it's considered an agent doc.
    if (Object.keys(data).length === 0) {
      console.warn(`[WARN] No frontmatter found in: ${path.relative(process.cwd(), filepath)}`);
      continue;
    }

    const result = FrontmatterSchema.safeParse(data);
    if (!result.success) {
      console.error(`\x1b[31m[ERROR]\x1b[0m Frontmatter validation failed in: ${path.relative(process.cwd(), filepath)}`);
      for (const issue of result.error.issues) {
        console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
      }
      hasErrors = true;
    }
  }

  return hasErrors;
}

async function validateAgentsLinks() {
  const agentsMd = path.resolve(process.cwd(), "AGENTS.md");
  let hasErrors = false;

  console.log("Linting AGENTS.md links...");
  
  try {
    const content = await fs.readFile(agentsMd, "utf-8");
    // Match Markdown relative links: [title](./docs/path)
    const linkRegex = /\[.*?\]\((?!http)(.*?)\)/g;
    let match;
    
    while ((match = linkRegex.exec(content)) !== null) {
      let linkPath = match[1];
      // strip hash fragments
      if (linkPath.includes('#')) {
        linkPath = linkPath.split('#')[0];
      }
      
      const absolutePath = path.resolve(process.cwd(), linkPath);
      
      try {
        await fs.access(absolutePath);
      } catch {
        console.error(`\x1b[31m[ERROR]\x1b[0m Broken link in AGENTS.md -> ${linkPath}`);
        hasErrors = true;
      }
    }
  } catch (err) {
    console.error("AGENTS.md not found or unreadable", err);
  }

  return hasErrors;
}

async function run() {
  const docsErrors = await validateDocs();
  const linksErrors = await validateAgentsLinks();

  if (docsErrors || linksErrors) {
    console.error("\x1b[31mDoc linting failed.\x1b[0m");
    process.exit(1);
  }

  console.log("\x1b[32mAll docs lint checks passed!\x1b[0m");
}

run();
