import { mkdir, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { createLogger } from '../../../lib/src/logger.ts'
import { INDEXER_IGNORED_DIRS, INDEXER_IGNORED_FILES } from './paths.ts'
import { sha256OfFile, sha256OfString } from '../../../lib/src/hash.ts'

const log = createLogger('indexer/scan')

export type ScanFileRow = {
  path: string
  relpath: string
  size: number
  sha256: string
  mtime_ms: number
  is_dir: boolean
}

export type ScanResult = {
  repo: {
    root: string
    generated_at: string
    total_files: number
    total_dirs: number
    total_bytes: number
  }
  package: Record<string, unknown> | null
  workspace: Record<string, unknown> | null
  scripts: Record<string, unknown> | null
  extensions: Record<string, number>
  files: ScanFileRow[]
}

/**
 * Walk a directory and return every non-ignored file with its hash and size.
 *
 * This is the "zero-token" foundation of the indexer. It does not look
 * at file contents beyond hashing; it only enumerates paths and metadata.
 */
export async function walkRepo(root: string): Promise<ScanFileRow[]> {
  const rows: ScanFileRow[] = []

  async function visit(absDir: string, relDir: string): Promise<void> {
    let entries: string[]
    try {
      entries = await readdir(absDir)
    } catch (err) {
      log.warn(`cannot read directory ${absDir}: ${(err as Error).message}`)
      return
    }
    for (const name of entries) {
      if (INDEXER_IGNORED_FILES.has(name)) continue
      if (INDEXER_IGNORED_DIRS.has(name)) continue
      if (name.startsWith('.')) {
        // Allow only top-level non-ignored dots; deeper dotfiles are kept.
      }
      const abs = path.join(absDir, name)
      const rel = relDir === '' ? name : path.join(relDir, name)
      let info: Awaited<ReturnType<typeof stat>>
      try {
        info = await stat(abs)
      } catch (err) {
        log.warn(`cannot stat ${abs}: ${(err as Error).message}`)
        continue
      }
      if (info.isDirectory()) {
        await visit(abs, rel)
      } else if (info.isFile() || info.isSymbolicLink()) {
        const isFile = info.isFile()
        const size = isFile ? info.size : 0
        const sha = isFile
          ? await sha256OfFile(abs).catch((err) => {
              log.warn(`cannot hash ${abs}: ${(err as Error).message}`)
              return ''
            })
          : sha256OfString('')
        rows.push({
          path: abs,
          relpath: rel,
          size,
          sha256: sha,
          mtime_ms: info.mtimeMs,
          is_dir: false,
        })
      }
    }
  }

  await visit(root, '')
  return rows
}

/**
 * Read a JSON file if it exists. Returns null on missing or invalid JSON.
 */
export async function readJsonOrNull<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const text = await readFile(filePath, 'utf8')
    return JSON.parse(text) as T
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    log.warn(`cannot read JSON ${filePath}: ${(err as Error).message}`)
    return null
  }
}

/**
 * Top-level scan entry point. Returns structured facts.
 */
export async function scanRepo(root: string, out: { factsDir: string }): Promise<ScanResult> {
  await mkdir(out.factsDir, { recursive: true })
  const files = await walkRepo(root)
  const total = files.length
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0)
  const extensions: Record<string, number> = {}
  for (const f of files) {
    const ext = path.extname(f.relpath).toLowerCase()
    if (ext === '') continue
    extensions[ext] = (extensions[ext] ?? 0) + 1
  }
  const repo = {
    root,
    generated_at: new Date().toISOString(),
    total_files: total,
    total_dirs: 0,
    total_bytes: totalBytes,
  }
  const pkg = await readJsonOrNull<Record<string, unknown>>(path.join(root, 'package.json'))
  const ws = (pkg && typeof pkg === 'object' && 'workspaces' in pkg
    ? ((pkg as Record<string, unknown>)['workspaces'] as Record<string, unknown>)
    : null)
  const scripts = (pkg && typeof pkg === 'object' && 'scripts' in pkg
    ? ((pkg as Record<string, unknown>)['scripts'] as Record<string, unknown>)
    : null)
  return { repo, package: pkg, workspace: ws, scripts, extensions, files }
}
