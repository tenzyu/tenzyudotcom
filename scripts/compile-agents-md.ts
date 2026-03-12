import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import matter from "gray-matter";

const ROOT = process.cwd();
const RULES_DIR = join(ROOT, "docs/design-docs/rules");
const REFERENCES_DIR = join(ROOT, "docs/design-docs/references");
const OUTPUT_PATH = join(ROOT, "docs/design-docs/AGENTS.md");

interface RuleMetadata {
  title: string;
  impact: string;
  impactDescription: string;
  tags?: string;
  chapter?: string;
  filename: string;
}

interface Rule {
  meta: RuleMetadata;
  content: string;
}

type ReferenceEntry = {
  title: string;
  filename: string;
}

const CHAPTER_ORDER = [
  "Foundations",
  "Security & Safety",
  "Implementation",
  "UI & UX",
  "Intelligence",
  "Reliability",
];

function compile() {
  const files = readdirSync(RULES_DIR).filter((f) => f.endsWith(".md"));
  const rules: Rule[] = [];
  const referenceFiles = readdirSync(REFERENCES_DIR).filter((f) => f.endsWith(".md"));
  const references: ReferenceEntry[] = [];

  for (const file of files) {
    const filePath = join(RULES_DIR, file);
    const rawContent = readFileSync(filePath, "utf-8");
    const { data, content } = matter(rawContent);

    if (!data.title) continue;

    rules.push({
      meta: {
        title: data.title,
        impact: data.impact || "MEDIUM",
        impactDescription: data.impactDescription || "",
        tags: data.tags,
        chapter: data.chapter || (data.tags ? data.tags.split(",")[0].trim() : "Other"),
        filename: file,
      },
      content: content.trim(),
    });
  }

  for (const file of referenceFiles) {
    const filePath = join(REFERENCES_DIR, file);
    const rawContent = readFileSync(filePath, "utf-8");
    const { data } = matter(rawContent);

    if (!data.title) continue;

    references.push({
      title: data.title,
      filename: file,
    });
  }

  const groups: Record<string, Rule[]> = {};
  for (const rule of rules) {
    const chapter = rule.meta.chapter || "Other";
    if (!groups[chapter]) groups[chapter] = [];
    groups[chapter].push(rule);
  }

  let output = "# Project Architecture Rules\n\n";
  output += "**Version 1.0.0**\n";
  output += "Engineering\n";
  output += `${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}\n\n`;
  output += "> **Note:**\n";
  output += "> This document is mainly for agents and LLMs to follow when maintaining,\n";
  output += "> generating, or refactoring the codebase. It defines the core constraints\n";
  output += "> and patterns that ensure consistency across all modules.\n\n";
  output += "---\n\n";
  output += "## Abstract\n\n";
  output += "This document aggregates granular architectural rules derived from the site's\n";
  output += "design philosophy. It prioritizes local-first development, strict ownership\n";
  output += "boundaries, and automated verification to maintain high technical integrity.\n\n";
  output += "---\n\n";
  output += "## Table of Contents\n\n";

  const sortedChapters = Object.keys(groups).sort((a, b) => {
    const idxA = CHAPTER_ORDER.indexOf(a);
    const idxB = CHAPTER_ORDER.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  sortedChapters.forEach((chapter, idx) => {
    const anchor = `${idx + 1}-${chapter.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    output += `${idx + 1}. [${chapter}](#${anchor})\n`;
    groups[chapter].forEach((rule, rIdx) => {
      const ruleAnchor = `${idx + 1}${rIdx + 1}-${rule.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      output += `   - ${idx + 1}.${rIdx + 1} [${rule.meta.title}](#${ruleAnchor})\n`;
    });
  });

  output += "\n---\n\n";

  sortedChapters.forEach((chapter, idx) => {
    const anchor = `${idx + 1}-${chapter.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    output += `## ${idx + 1}. ${chapter} <a id="${anchor}"></a>\n\n`;

    groups[chapter].forEach((rule, rIdx) => {
      const ruleAnchor = `${idx + 1}${rIdx + 1}-${rule.meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      output += `### ${idx + 1}.${rIdx + 1} ${rule.meta.title} <a id="${ruleAnchor}"></a>\n\n`;
      output += `**Impact: ${rule.meta.impact}**\n\n`;
      if (rule.meta.impactDescription) {
        output += `> ${rule.meta.impactDescription}\n\n`;
      }
      
      let body = rule.content;
      if (body.startsWith("# ")) {
          body = body.split("\n").slice(1).join("\n").trim();
      }
      
      output += body + "\n\n";
    });
    
    if (idx < sortedChapters.length - 1) {
        output += "---\n\n";
    }
  });

  if (references.length > 0) {
    output += "\n---\n\n";
    output += "## Repair References\n\n";
    output += "Use these short guides when a linter points you at a specific repair path.\n\n";
    references
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((reference) => {
        output += `- [${reference.title}](./references/${reference.filename})\n`;
      });
  }

  writeFileSync(OUTPUT_PATH, output);
  console.log(`Generated: ${OUTPUT_PATH}`);
}

compile();
