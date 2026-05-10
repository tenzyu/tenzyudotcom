import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import tailwindcss from '@tailwindcss/postcss'

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)))
const cssEntries = [
  ['src/styles.css', 'dist/styles.css'],
  ['src/workbench.css', 'dist/workbench.css'],
]

await mkdir(join(packageRoot, 'dist'), { recursive: true })

for (const [input, output] of cssEntries) {
  const from = join(packageRoot, input)
  const to = join(packageRoot, output)
  const css = await readFile(from, 'utf8')
  const result = await postcss([tailwindcss()]).process(css, { from, to })

  await writeFile(to, result.css)

  if (result.map) {
    await writeFile(`${to}.map`, result.map.toString())
  }
}
