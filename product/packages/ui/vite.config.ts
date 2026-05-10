import { existsSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const packageRoot = dirname(fileURLToPath(import.meta.url))
const distRoot = join(packageRoot, 'dist')

function entriesFromDir(prefix: string, relativeDir: string) {
  const absoluteDir = join(packageRoot, relativeDir)
  if (!existsSync(absoluteDir)) return {}

  return Object.fromEntries(
    readdirSync(absoluteDir)
      .filter((fileName) => ['.ts', '.tsx'].includes(extname(fileName)))
      .map((fileName) => [
        `${prefix}${fileName.replace(/\.(tsx|ts)$/, '')}`,
        join(absoluteDir, fileName),
      ]),
  )
}

const entries = {
  index: join(packageRoot, 'src/index.ts'),
  cn: join(packageRoot, 'src/lib/cn.ts'),
  foundations: join(packageRoot, 'src/tokens/foundations.ts'),
  ...entriesFromDir('', 'src/components/ui'),
  ...entriesFromDir('', 'src/components/site'),
}

const external = [
  /^react($|\/)/,
  /^react-dom($|\/)/,
  /^@base-ui\/react($|\/)/,
  /^@hookform\/resolvers($|\/)/,
  /^class-variance-authority($|\/)/,
  /^clsx($|\/)/,
  /^cmdk($|\/)/,
  /^date-fns($|\/)/,
  /^embla-carousel-react($|\/)/,
  /^input-otp($|\/)/,
  /^lucide-react($|\/)/,
  /^next-themes($|\/)/,
  /^radix-ui($|\/)/,
  /^react-day-picker($|\/)/,
  /^react-hook-form($|\/)/,
  /^react-resizable-panels($|\/)/,
  /^recharts($|\/)/,
  /^sonner($|\/)/,
  /^tailwind-merge($|\/)/,
  /^vaul($|\/)/,
  /^zod($|\/)/,
]

function flatDtsFilePath(filePath: string) {
  const relativePath = relative(distRoot, filePath).replaceAll('\\', '/')
  const componentMatch = relativePath.match(/^components\/(?:ui|site)\/(.+)\.d\.ts$/)
  if (componentMatch) return join(distRoot, `${componentMatch[1]}.d.ts`)
  if (relativePath === 'lib/cn.d.ts') return join(distRoot, 'cn.d.ts')
  if (relativePath === 'tokens/foundations.d.ts') return join(distRoot, 'foundations.d.ts')
  if (relativePath === 'index.d.ts') return filePath
  return false
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      entryRoot: 'src',
      outDir: 'dist',
      declarationOnly: true,
      beforeWriteFile(filePath, content) {
        const nextFilePath = flatDtsFilePath(filePath)
        if (!nextFilePath) return false
        return { filePath: nextFilePath, content }
      },
    }),
  ],
  build: {
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    lib: {
      entry: entries,
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external,
      output: {
        preserveModules: false,
        exports: 'named',
      },
    },
  },
})
