import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

describe("compile-agents-md script", () => {
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "compile-agents-md-test-"));
  });

  afterAll(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  const setupProject = ({
    rules,
    references = {},
  }: {
    rules?: Record<string, string>;
    references?: Record<string, string>;
  }) => {
    rmSync(join(tmpDir, "docs"), { recursive: true, force: true });

    if (rules) {
      const rulesDir = join(tmpDir, "docs/design-docs/rules");
      mkdirSync(rulesDir, { recursive: true });
      for (const [name, content] of Object.entries(rules)) {
        writeFileSync(join(rulesDir, name), content);
      }
    }

    if (Object.keys(references).length > 0) {
      const referencesDir = join(tmpDir, "docs/design-docs/references");
      mkdirSync(referencesDir, { recursive: true });
      for (const [name, content] of Object.entries(references)) {
        writeFileSync(join(referencesDir, name), content);
      }
    }
  };

  const runCompiler = () => {
    const scriptPath = resolve(process.cwd(), "scripts/compile-agents-md.ts");
    return Bun.spawnSync(["bun", scriptPath], {
      cwd: tmpDir,
      env: { ...process.env },
      stderr: "pipe",
      stdout: "pipe",
    });
  };

  test("should compile rules into AGENTS.md without requiring references", () => {
    setupProject({
      rules: {
        "rule1.md":
          '---\ntitle: "Rule 1"\nimpact: HIGH\nchapter: Foundations\n---\n# Rule 1\nBody 1\n\n**Avoid:**\n\n```text\nbad\n```',
        "rule2.md": '---\ntitle: "Rule 2"\nimpact: MEDIUM\nchapter: Security & Safety\n---\n# Rule 2\nBody 2',
      },
    });

    const result = runCompiler();
    expect(result.success).toBe(true);

    const agentsPath = join(tmpDir, "docs/design-docs/AGENTS.md");
    expect(existsSync(agentsPath)).toBe(true);

    const content = readFileSync(agentsPath, "utf-8");
    expect(content).toContain("# Project Architecture Rules");
    expect(content).toContain("1. [Foundations](#1-foundations)");
    expect(content).toContain("2. [Security & Safety](#2-security-safety)");
    expect(content).toContain("### 1.1 Rule 1");
    expect(content).toContain("### 2.1 Rule 2");
    expect(content).toContain("Body 1");
    expect(content).toContain("**Avoid:**");
    expect(content).not.toContain("## Repair References");
  });

  test("should emit a clear error when the rules directory is missing", () => {
    setupProject({});

    const result = runCompiler();
    expect(result.success).toBe(false);

    const stderr = result.stderr.toString();
    expect(stderr).toContain("Missing rules directory:");
    expect(stderr).toContain("Expected project structure:");
    expect(stderr).toContain("docs/design-docs/rules");
    expect(stderr).toContain("docs/design-docs/references");
  });
});
