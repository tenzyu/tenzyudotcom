// One-shot evidence over the actual emitted package files. Not a bundler resolution proof.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { gzipSync } from 'node:zlib'

const output = process.argv[2]
if (!output) throw new Error('Pass the evidence output file')
const packages = ['ui', 'osu-skin-core', 'publishing-domain', 'revisioned-content']
const missing = []
const sizes = []
function walk(root, directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) walk(root, path)
    else if (entry.isFile()) {
      const bytes = readFileSync(path)
      sizes.push({ path, bytes: bytes.length, gzip: gzipSync(bytes).length })
    }
  }
}
function inspectTarget(name, subpath, root, target) {
  if (typeof target === 'string') {
    if (!target.startsWith('./') || !existsSync(resolve(root, target)) ||
        !statSync(resolve(root, target)).isFile()) missing.push({ name, subpath, target })
  } else if (target && typeof target === 'object') {
    for (const [condition, entry] of Object.entries(target))
      inspectTarget(name, subpath + ':' + condition, root, entry)
  }
}
const exports = {}
for (const name of packages) {
  const root = join('product/packages', name)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  exports[name] = Object.keys(manifest.exports ?? {})
  for (const [subpath, target] of Object.entries(manifest.exports ?? {}))
    inspectTarget(name, subpath, root, target)
  if (existsSync(join(root, 'dist'))) walk(root, join(root, 'dist'))
}
const frontend = 'product/apps/osu-skin-workbench/dist'
if (existsSync(frontend)) walk(frontend, frontend)
const result = { exports, missing, sizes: sizes.sort((a, b) => b.bytes - a.bytes) }
writeFileSync(output, JSON.stringify(result, null, 2) + '\n')
console.log(JSON.stringify({ exports: Object.fromEntries(Object.entries(exports).map(([name, paths]) => [name, paths.length])), missing, largest: result.sizes.slice(0, 12) }, null, 2))
if (missing.length) process.exitCode = 1
