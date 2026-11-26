import { access, readdir } from 'node:fs/promises'
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
  workspaces?: {
    catalog?: Record<string, string>
    catalogs?: Record<string, Record<string, string>>
    packages?: string[]
  }
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

const rootPackageJson = JSON.parse(
  await Bun.file(join(workspaceRoot, 'package.json')).text(),
) as PackageJson

let failed = false
// The workspace catalog is the version authority. Keep the policy's scope,
// not a second table of pinned versions.
const alignedDependencies = [
  'typescript',
  'react',
  'react-dom',
  '@types/react',
  '@types/react-dom',
  'vite',
  'tailwindcss',
  '@tailwindcss/postcss',
]
const standardVersions = new Map<string, string>()
for (const name of alignedDependencies) {
  const version = rootPackageJson.workspaces?.catalog?.[name]
  if (!version) {
    failed = true
    console.error(`package.json: missing required catalog entry ${name}`)
  } else {
    standardVersions.set(name, version)
  }
}

const peerVersionOverrides = new Map([
  ['react', '>=19 <20'],
  ['react-dom', '>=19 <20'],
])

if (rootPackageJson.packageManager !== 'bun@1.4.5') {
  failed = true
  console.error('package.json: packageManager must be bun@1.4.5')
}

for (const relativePath of packageJsonPaths) {
  const absolutePath = join(workspaceRoot, relativePath)
  const packageJson = JSON.parse(await Bun.file(absolutePath).text()) as PackageJson

  for (const field of dependencyFields) {
    const dependencies = packageJson[field]
    if (!dependencies) continue

    for (const [name, version] of Object.entries(dependencies)) {
      const effectiveVersion = resolveCatalogVersion(relativePath, field, name, version)

      if (isForbiddenFloatingRange(effectiveVersion)) {
        failed = true
        console.error(`${relativePath}: ${field}.${name} must not use ${version}`)
      }

      const expectedVersion =
        field === 'peerDependencies'
          ? (peerVersionOverrides.get(name) ?? standardVersions.get(name))
          : standardVersions.get(name)

      if (expectedVersion && effectiveVersion !== expectedVersion) {
        failed = true
        console.error(
          `${relativePath}: ${field}.${name} must use ${expectedVersion}, found ${version}`,
        )
      }
    }
  }
}

// Consume Nx's existing project graph rather than maintaining an independent graph.
const graphPath = process.argv[2]
if (graphPath) {
  type Project = { data: { root: string; tags?: string[] } }
  type Edge = { source: string; target: string }
  const { graph } = JSON.parse(await Bun.file(graphPath).text()) as {
    graph: { nodes: Record<string, Project>; dependencies: Record<string, Edge[]> }
  }
  for (const edges of Object.values(graph.dependencies)) {
    for (const { source, target } of edges) {
      const from = graph.nodes[source]
      const to = graph.nodes[target]
      if (!from || !to) continue // External npm dependencies are not workspace projects.
      const fromTags = from.data.tags ?? []
      const toTags = to.data.tags ?? []
      const violation =
        (from.data.root.startsWith('product/') && (to.data.root === 'repo-ops' || to.data.root.startsWith('repo-ops/'))) ||
        to.data.root.startsWith('product/apps/') ||
        (fromTags.includes('runtime:pure') && !toTags.includes('runtime:pure')) ||
        (fromTags.includes('domain:design-system') && !toTags.includes('domain:design-system')) ||
        (fromTags.includes('runtime:server') && toTags.includes('domain:publishing'))
      if (violation) {
        failed = true
        console.error(`Forbidden workspace dependency: ${source} -> ${target}`)
      }
    }
  }
}

if (failed) process.exit(1)

function isForbiddenFloatingRange(version: string) {
  return version === '*' || /^(\^|~)?latest$/i.test(version)
}

function resolveCatalogVersion(
  relativePath: string,
  field: keyof PackageJson,
  name: string,
  version: string,
) {
  if (version !== 'catalog:') return version

  const catalogVersion = rootPackageJson.workspaces?.catalog?.[name]
  if (!catalogVersion) {
    failed = true
    console.error(`${relativePath}: ${field}.${name} references missing catalog entry`)
    return version
  }

  return catalogVersion
}

async function packageJsonsUnder(relativeRoot: string) {
  const absoluteRoot = join(workspaceRoot, relativeRoot)
  const entries = await readdir(absoluteRoot, { withFileTypes: true }).catch(() => [])

  const candidates = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => `${relativeRoot}/${entry.name}/package.json`)

  const existing = await Promise.all(
    candidates.map(async (relativePath) => {
      const absolutePath = join(workspaceRoot, relativePath)
      try {
        await access(absolutePath)
        return relativePath
      } catch {
        return undefined
      }
    }),
  )

  return existing.filter(
    (relativePath): relativePath is string => relativePath !== undefined,
  )
}
