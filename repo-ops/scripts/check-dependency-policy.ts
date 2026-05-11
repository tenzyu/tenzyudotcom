import { readdir } from 'node:fs/promises'
import { join } from 'node:path'

const workspaceRoot = process.cwd()
const packageJsonPaths = [
  'package.json',
  ...(await packageJsonsUnder('product/apps')),
  ...(await packageJsonsUnder('product/packages')),
]

type PackageJson = {
  name?: string
  packageManager?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
}

const dependencyFields = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
] as const satisfies readonly (keyof PackageJson)[]

let failed = false
const standardVersions = new Map([
  ['typescript', '^5.9.3'],
  ['react', '19.2.4'],
  ['react-dom', '19.2.4'],
  ['@types/react', '19.2.14'],
  ['@types/react-dom', '19.2.3'],
  ['vite', '^8.0.11'],
  ['tailwindcss', '^4.2.1'],
  ['@tailwindcss/postcss', '^4.2.1'],
])

const peerVersionOverrides = new Map([
  ['react', '>=19 <20'],
  ['react-dom', '>=19 <20'],
])

const rootPackageJson = JSON.parse(
  await Bun.file(join(workspaceRoot, 'package.json')).text(),
) as PackageJson

if (rootPackageJson.packageManager !== 'bun@1.3.10') {
  failed = true
  console.error('package.json: packageManager must be bun@1.3.10')
}

for (const relativePath of packageJsonPaths) {
  const absolutePath = join(workspaceRoot, relativePath)
  const packageJson = JSON.parse(await Bun.file(absolutePath).text()) as PackageJson

  for (const field of dependencyFields) {
    const dependencies = packageJson[field]
    if (!dependencies) continue

    for (const [name, version] of Object.entries(dependencies)) {
      if (isForbiddenFloatingRange(version)) {
        failed = true
        console.error(`${relativePath}: ${field}.${name} must not use ${version}`)
      }

      const expectedVersion =
        field === 'peerDependencies'
          ? (peerVersionOverrides.get(name) ?? standardVersions.get(name))
          : standardVersions.get(name)

      if (expectedVersion && version !== expectedVersion) {
        failed = true
        console.error(
          `${relativePath}: ${field}.${name} must use ${expectedVersion}, found ${version}`,
        )
      }
    }
  }
}

if (failed) process.exit(1)

function isForbiddenFloatingRange(version: string) {
  return version === '*' || /^(\^|~)?latest$/i.test(version)
}

async function packageJsonsUnder(relativeRoot: string) {
  const absoluteRoot = join(workspaceRoot, relativeRoot)
  const entries = await readdir(absoluteRoot, { withFileTypes: true }).catch(() => [])

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${relativeRoot}/${entry.name}/package.json`)
}
