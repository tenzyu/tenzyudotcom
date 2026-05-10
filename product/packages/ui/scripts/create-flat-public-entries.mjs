import { readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const groups = [
  ['dist/components/ui', './components/ui'],
  ['dist/components/site', './components/site'],
]

const entries = []

for (const [distDir, importDir] of groups) {
  for (const entry of await readdir(distDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue
    const name = basename(entry.name, '.js')
    entries.push([name, `${importDir}/${entry.name}`])
  }
}

entries.push(['cn', './lib/cn.js'])
entries.push(['foundations', './tokens/foundations.js'])

for (const [name, target] of entries) {
  await writeFile(join('dist', `${name}.js`), `export * from ${JSON.stringify(target)};\n`)
  await writeFile(join('dist', `${name}.d.ts`), `export * from ${JSON.stringify(target)};\n`)
}
