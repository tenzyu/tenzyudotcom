/// <reference types='vitest' />

import * as fs from 'node:fs'
import * as path from 'node:path'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const projectRoot = import.meta.dirname
const srcRoot = path.resolve(projectRoot, 'src')
const uiRoot = path.resolve(srcRoot, 'components/ui')
const outDir = path.resolve(projectRoot, './dist')

const componentEntries = Object.fromEntries(
  fs
    .readdirSync(uiRoot)
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .filter((file) => !file.endsWith('.test.ts'))
    .filter((file) => !file.endsWith('.test.tsx'))
    .filter((file) => !file.endsWith('.spec.ts'))
    .filter((file) => !file.endsWith('.spec.tsx'))
    .filter((file) => !file.endsWith('.stories.ts'))
    .filter((file) => !file.endsWith('.stories.tsx'))
    .map((file) => {
      const entryName = path.basename(file, path.extname(file))

      return [entryName, path.resolve(uiRoot, file)] as const
    })
)

export default defineConfig(() => ({
  root: projectRoot,
  resolve: { alias: { '@': srcRoot } },

  plugins: [
    react(),
    tailwindcss(),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      outDirs: [outDir],
      tsconfigPath: path.join(projectRoot, 'tsconfig.lib.json'),
      pathsToAliases: false,
      exclude: ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    }),
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
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
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
