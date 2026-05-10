import { rm } from 'node:fs/promises'

const files = [
  'dist/index.js',
  'dist/index.js.map',
  'dist/index.d.ts',
  'dist/index.d.ts.map',
  'dist/web.js',
  'dist/web.js.map',
  'dist/web.d.ts',
  'dist/web.d.ts.map',
  'dist/advanced.js',
  'dist/advanced.js.map',
  'dist/advanced.d.ts',
  'dist/advanced.d.ts.map',
  'dist/browser.js',
  'dist/browser.js.map',
  'dist/browser.d.ts',
  'dist/browser.d.ts.map',
]

for (const file of files) {
  await rm(file, { force: true })
}
