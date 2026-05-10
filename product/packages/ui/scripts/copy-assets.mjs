import { copyFile, mkdir } from 'node:fs/promises'

await mkdir('dist', { recursive: true })
await copyFile('src/styles.css', 'dist/styles.css')
await copyFile('src/workbench.css', 'dist/workbench.css')
