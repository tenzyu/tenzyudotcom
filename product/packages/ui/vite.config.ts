import { existsSync, readdirSync } from 'node:fs'
import { dirname, extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
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
  'variant-policy': join(packageRoot, 'src/tokens/variant-policy.ts'),
  ...entriesFromDir('', 'src/components/ui'),
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

function flatDtsFile(filePath: string, content: string) {
  const relativePath = relative(distRoot, filePath).replaceAll('\\', '/')
  const componentMatch = relativePath.match(/^components\/ui\/(.+)\.d\.ts$/)
  if (componentMatch) return { filePath: join(distRoot, `${componentMatch[1]}.d.ts`), content }
  if (relativePath === 'lib/cn.d.ts') return { filePath: join(distRoot, 'cn.d.ts'), content }
  if (relativePath === 'tokens/foundations.d.ts') {
    return { filePath: join(distRoot, 'foundations.d.ts'), content }
  }
  if (relativePath === 'tokens/variant-policy.d.ts') {
    return { filePath: join(distRoot, 'variant-policy.d.ts'), content }
  }
  if (relativePath === 'index.d.ts') return { filePath, content }
  return false
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      entryRoot: 'src',
      outDirs: 'dist',
      beforeWriteFile(filePath, content) {
        return flatDtsFile(filePath, content)
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

