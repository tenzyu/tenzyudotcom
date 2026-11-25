/// <reference types='vitest' />

import * as fs from 'node:fs'
import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const projectRoot = import.meta.dirname
const srcRoot = path.resolve(projectRoot, 'src')
const outDir = path.resolve(projectRoot, './dist')
const packageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
)
const externalPackages = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]
function isExternal(id: string) {
  return externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`))
}

const componentEntries = Object.fromEntries(
  Object.keys(packageJson.exports)
    .filter((entry) => entry !== '.' && entry !== './styles.css')
    .map((entry) => {
      const declaration = packageJson.exports[entry].types as string
      const source = declaration.replace(/^\.\/dist\//, './').replace(/\.d\.ts$/, '.tsx')
      return [entry.slice(2), path.resolve(projectRoot, source)] as const
    })
)

export default defineConfig(() => ({
  root: projectRoot,
  resolve: { alias: { '@': srcRoot } },

  plugins: [
    react(),
    tailwindcss(),
  ],
  // Configuration for building your library.
  // See: https://vite.dev/guide/build.html#library-mode
  build: {
    outDir,
    emptyOutDir: true,
    reportCompressedSize: true,
    sourcemap: true,
    commonjsOptions: { transformMixedEsModules: true },
    lib: {
      entry: {
        index: path.resolve(srcRoot, 'index.ts'),
        ...componentEntries,
      },
      name: 'ui',
      formats: ['es' as const],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'styles',
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: isExternal,
      output: {
        preserveModules: true,
        preserveModulesRoot: path.resolve(projectRoot, 'src'),
        entryFileNames: '[name].js',
        chunkFileNames: '_chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'styles.css') {
            return 'styles.css'
          }
          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
}))
