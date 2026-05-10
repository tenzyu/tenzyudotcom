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

for (const relativePath of packageJsonPaths) {
  const absolutePath = join(workspaceRoot, relativePath)
  const packageJson = JSON.parse(await Bun.file(absolutePath).text()) as PackageJson

  for (const field of dependencyFields) {
    const dependencies = packageJson[field]
    if (!dependencies) continue

    for (const [name, version] of Object.entries(dependencies)) {
      if (/^(\^|~)?latest$/i.test(version)) {
        failed = true
        console.error(`${relativePath}: ${field}.${name} must not use ${version}`)
      }
    }
  }
}

if (failed) process.exit(1)

async function packageJsonsUnder(relativeRoot: string) {
  const absoluteRoot = join(workspaceRoot, relativeRoot)
  const entries = await readdir(absoluteRoot, { withFileTypes: true }).catch(() => [])

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${relativeRoot}/${entry.name}/package.json`)
}
