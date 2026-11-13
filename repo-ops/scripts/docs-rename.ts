import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync, statSync, readdirSync } from "node:fs";
import { join, relative, dirname, resolve, extname } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  options: {
    "dry-run": { type: "boolean", default: false },
    "list-completions": { type: "string" },
    "list-directories": { type: "boolean" },
  },
  allowPositionals: true,
});

const ROOT = process.cwd();

// Handle auto-completion requests
if (values["list-completions"] !== undefined || values["list-directories"]) {
  const filter = values["list-completions"] || "";
  const docsDir = join(ROOT, "docs");

  if (!existsSync(docsDir)) process.exit(0);

  const isDirOnly = !!values["list-directories"];

  function listAllRecursive(dir: string): string[] {
    const entries = readdirSync(dir, { withFileTypes: true });
    return entries.flatMap((entry) => {
      const fullPath = join(dir, entry.name);
      const relPath = relative(ROOT, fullPath);
      if (entry.isDirectory()) {
        return [relPath, ...listAllRecursive(fullPath)];
      }
      return isDirOnly ? [] : [relPath];
    });
  }

  const matches = listAllRecursive(docsDir).filter(p => p.startsWith(filter));
  console.log(matches.join("\n"));
  process.exit(0);
}

if (positionals.length < 2) {
  console.error("Usage: bun run docs-rename <old> <new> [--dry-run]");
  process.exit(1);
}

const oldPathRaw = positionals[0];
const newPathRaw = positionals[1];
const isDryRun = values["dry-run"];

const oldPath = resolve(ROOT, oldPathRaw);
const newPath = resolve(ROOT, newPathRaw);

const sourceExists = existsSync(oldPath);

if (!sourceExists) {
  console.warn(`Warning: Source path does not exist: ${oldPathRaw}. Only references will be updated.`);
}

// Check for destination existence (only if not dry run)
if (!isDryRun && existsSync(newPath)) {
  console.warn(`Destination already exists: ${newPathRaw}. This script will proceed but use caution.`);
}

// Helper to get all files in a directory recursively
function getAllFiles(dir: string): string[] {
  const stats = statSync(dir);
  if (stats.isFile()) return [dir];
  const entries = readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const res = join(dir, entry.name);
    return entry.isDirectory() ? getAllFiles(res) : res;
  });
}

const movedFilesMap = new Map<string, string>(); // absolute old path -> absolute new path
const isDir = sourceExists ? statSync(oldPath).isDirectory() : oldPathRaw.endsWith('/') || !extname(oldPathRaw);
const targetFiles = sourceExists ? getAllFiles(oldPath) : [oldPath];

if (isDir) {
    movedFilesMap.set(oldPath, newPath);
}

for (const file of targetFiles) {
  const rel = sourceExists ? relative(oldPath, file) : "";
  const targetNewPath = isDir && sourceExists ? join(newPath, rel) : newPath;
  movedFilesMap.set(file, targetNewPath);
}

// Helper to resolve path mapping, supporting directory prefixes
function resolveMappedPath(candidate: string): string | null {
    // 1. Exact or near-exact file match
    for (const [oldF, newF] of movedFilesMap) {
        if (oldF === candidate || oldF === candidate + ".md" || oldF.replace(/\.md$/, '') === candidate) {
            return newF;
        }
    }
    // 2. Directory prefix match
    for (const [oldF, newF] of movedFilesMap) {
        if (candidate.startsWith(oldF + "/")) {
            return join(newF, candidate.slice(oldF.length + 1));
        }
    }
    return null;
}

// Files that might contain references
const searchDirs = [join(ROOT, "docs"), join(ROOT, "src")];
const containerFiles = searchDirs.flatMap(dir => existsSync(dir) ? getAllFiles(dir) : []);

console.log(`${isDryRun ? "[DRY RUN] " : ""}Scanning ${containerFiles.length} files for references...`);

const changes: { file: string; oldContent: string; newContent: string }[] = [];

for (const containerFile of containerFiles) {
  const originalContent = readFileSync(containerFile, "utf-8");
  let content = originalContent;

  const currentAbsPath = containerFile;
  const isMoving = movedFilesMap.has(currentAbsPath);
  const futureAbsPath = movedFilesMap.get(currentAbsPath) || currentAbsPath;

  // 1. Replace Mentions: @docs/path
  content = content.replace(/@docs\/([a-zA-Z0-9\-_./]+)/g, (match, path) => {
    const fullOldPathCandidate = resolve(ROOT, "docs", path);
    const newFile = resolveMappedPath(fullOldPathCandidate);
    if (newFile) {
        const newRelToDocs = relative(join(ROOT, "docs"), newFile);
        const hasMd = path.endsWith(".md");
        return `@docs/${hasMd ? newRelToDocs : newRelToDocs.replace(/\.md$/, '')}`;
    }
    return match;
  });

  // 2. Replace Markdown links and internal relative paths
  content = content.replace(/(\[.*?\]\()(.+?)(\))/g, (match, prefix, link, suffix) => {
    // Skip external URLs
    if (link.includes("://") || link.startsWith("#")) return match;

    let targetAbsPath: string;
    if (link.startsWith("/")) {
      targetAbsPath = resolve(ROOT, link.slice(1));
    } else {
      targetAbsPath = resolve(dirname(currentAbsPath), link);
      // Fallback: If it's ./docs/ but the file is already in docs/, 
      // check if it's meant to be root-relative.
      if (!sourceExists && link.startsWith("./docs/") && !existsSync(targetAbsPath)) {
          const rootRelativeCandidate = resolve(ROOT, link.slice(2));
          if (rootRelativeCandidate === oldPath || rootRelativeCandidate + ".md" === oldPath) {
              targetAbsPath = rootRelativeCandidate;
          }
      } else if (link.startsWith("./docs/") && !existsSync(targetAbsPath)) {
          // Even if source exists, if the link is broken but matches oldPath as root-relative
          const rootRelativeCandidate = resolve(ROOT, link.slice(2));
          if (rootRelativeCandidate === oldPath || rootRelativeCandidate + ".md" === oldPath) {
              targetAbsPath = rootRelativeCandidate;
          }
      }
    }

    const newTargetAbsPath = resolveMappedPath(targetAbsPath);

    if (newTargetAbsPath || isMoving) {
        const finalTargetAbsPath = newTargetAbsPath || targetAbsPath;
        let newLink: string;
        if (link.startsWith("/")) {
            newLink = "/" + relative(ROOT, finalTargetAbsPath);
        } else {
            newLink = relative(dirname(futureAbsPath), finalTargetAbsPath);
            if (!newLink.startsWith(".")) newLink = "./" + newLink;
        }

        const originalHasMd = link.toLowerCase().endsWith(".md");
        const newHasMd = newLink.toLowerCase().endsWith(".md");
        if (!originalHasMd && newHasMd) {
            newLink = newLink.replace(/\.md$/i, "");
        } else if (originalHasMd && !newHasMd && extname(finalTargetAbsPath) === ".md") {
            newLink += ".md";
        }

        // Preserve trailing slash from the original link
        if (link.endsWith("/") && !newLink.endsWith("/")) {
            newLink += "/";
        }
        
        return `${prefix}${newLink}${suffix}`;
    }
    return match;
  });

  if (content !== originalContent) {
    changes.push({ file: containerFile, oldContent: originalContent, newContent: content });
  }
}

if (isDryRun) {
  for (const change of changes) {
    console.log(`\nFile: ${relative(ROOT, change.file)}`);
    const oldLines = change.oldContent.split("\n");
    const newLines = change.newContent.split("\n");
    for (let i = 0; i < newLines.length; i++) {
        if (newLines[i] !== oldLines[i]) {
            if (oldLines[i]) console.log(`- ${oldLines[i].trim()}`);
            console.log(`+ ${newLines[i].trim()}`);
            break;
        }
    }
  }
  console.log(`\nTotal files with updated references: ${changes.length}`);
  console.log(`Total files to move: ${movedFilesMap.size}`);
} else {
  for (const change of changes) {
    writeFileSync(change.file, change.newContent);
    console.log(`Updated: ${relative(ROOT, change.file)}`);
  }
  for (const [oldF, newF] of movedFilesMap) {
    if (existsSync(oldF)) {
      const dir = dirname(newF);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      renameSync(oldF, newF);
      console.log(`Moved: ${relative(ROOT, oldF)} -> ${relative(ROOT, newF)}`);
    } else {
      console.log(`Skipped move (source not found): ${relative(ROOT, oldF)}`);
    }
  }
}
