import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { analyzeImportBoundaries } from './feature-slice-boundaries'

async function writeProjectFile(root: string, relativePath: string, content: string) {
  const absolutePath = path.join(root, relativePath)
  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, content, 'utf8')
}

describe('feature-slice-boundaries', () => {
  let tempDir: string
  let issues: ReturnType<typeof analyzeImportBoundaries>

  beforeAll(async () => {
    tempDir = await mkdtemp(path.join(tmpdir(), 'lint-import-boundaries-'))

    await writeProjectFile(
      tempDir,
      'tsconfig.json',
      JSON.stringify({
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          strict: true,
          baseUrl: '.',
          paths: {
            '@/*': ['src/*'],
          },
        },
        include: ['src/**/*.ts', 'src/**/*.tsx'],
      }),
    )

    await writeProjectFile(
      tempDir,
      'vsa.config.json',
      JSON.stringify({
        architecture: {
          appRoots: ['src/app'],
          featureMarker: '_features',
          promotionRoots: ['src/features', 'src/lib'],
          sharedRoots: ['src/features', 'src/components'],
          utilityRoots: ['src/lib', 'src/config'],
        },
      }),
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/notes/_features/local.ts',
      `export const local = 1`,
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/(main)/pointers/_features/consumer.ts',
      `
import { local } from '@/app/[locale]/(main)/notes/_features/local'

export const consumer = local
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/shared/view.tsx',
      `
import { local } from '@/app/[locale]/(main)/notes/_features/local'

export function View() {
  return <div>{local}</div>
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/features/shared/thing.ts',
      `export const thing = 1`,
    )

    await writeProjectFile(
      tempDir,
      'src/components/widget.tsx',
      `
import { repo } from '@/lib/data/data.infra'

export function Widget() {
  return <div>{repo}</div>
}
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/lib/data/data.infra.ts',
      `export const repo = 1`,
    )

    await writeProjectFile(
      tempDir,
      'src/lib/core/core.domain.ts',
      `
import { makeThing } from '@/lib/core/core.assemble'

export const core = makeThing()
      `.trim(),
    )

    await writeProjectFile(
      tempDir,
      'src/lib/core/core.assemble.ts',
      `export const makeThing = () => 1`,
    )

    await writeProjectFile(
      tempDir,
      'src/app/[locale]/notes/page.tsx',
      `
import { repo } from '@/lib/data/data.infra'

export default function Page() {
  return <div>{repo}</div>
}
      `.trim(),
    )

    issues = analyzeImportBoundaries({
      projectRoot: tempDir,
      tsconfigPath: path.join(tempDir, 'tsconfig.json'),
    })
  })

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('reports cross-route _features dependencies', () => {
    expect(issues).toContainEqual({
      ruleName:
        'Route-local slices under src/app/[locale]/(main)/pointers/_features must not depend on another route-local slice.',
      from: 'src/app/[locale]/(main)/pointers/_features/consumer.ts',
      to: 'src/app/[locale]/(main)/notes/_features/local.ts',
    })
  })

  test('reports shared features importing route-local _features', () => {
    expect(issues).toContainEqual({
      ruleName:
        'Shared modules must not depend on route-local slices.',
      from: 'src/features/shared/view.tsx',
      to: 'src/app/[locale]/(main)/notes/_features/local.ts',
    })
  })

  test('reports modules with too few dependents in shared layers', () => {
    expect(issues).toContainEqual({
      ruleName:
        'Modules in promoted/shared layers should only exist after promotion from route-local slices, which requires at least two dependents.',
      from: '(project)',
      to: 'src/features/shared/thing.ts',
    })
  })

  test('reports general infra imports from non-assemble modules', () => {
    expect(issues).toContainEqual({
      ruleName:
        'Only assemble and infra modules may depend on general infrastructure implementations.',
      from: 'src/components/widget.tsx',
      to: 'src/lib/data/data.infra.ts',
    })
  })

  test('reports reverse dependencies from domain to assemble', () => {
    expect(issues).toContainEqual({
      ruleName:
        'Domain and port modules must not depend on outer implementation layers like infra or assemble.',
      from: 'src/lib/core/core.domain.ts',
      to: 'src/lib/core/core.assemble.ts',
    })
  })

  test('reports entrypoint imports of infra modules', () => {
    expect(issues).toContainEqual({
      ruleName:
        'Route entrypoints must not depend directly on infrastructure implementations.',
      from: 'src/app/[locale]/notes/page.tsx',
      to: 'src/lib/data/data.infra.ts',
    })
  })
})
