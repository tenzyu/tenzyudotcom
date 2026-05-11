import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, expect, test } from 'bun:test'
import { analyzeWorkspaceBoundaries } from './workspace-boundaries'

const roots: string[] = []

afterEach(async () => {
  for (const root of roots.splice(0)) {
    await import('node:fs/promises').then(({ rm }) =>
      rm(root, { force: true, recursive: true }),
    )
  }
})

async function makeFixture() {
  const root = join('/tmp', `tenzyu-linter-${crypto.randomUUID()}`)
  roots.push(root)
  await mkdir(join(root, 'product/apps/web/src'), { recursive: true })
  await mkdir(join(root, 'product/packages/ui/src'), { recursive: true })
  await mkdir(join(root, 'product/packages/osu-skin-core/src'), { recursive: true })
  await writeFile(
    join(root, 'product/apps/web/package.json'),
    JSON.stringify({ name: '@fixture/web' }),
  )
  await writeFile(
    join(root, 'product/apps/web/project.json'),
    JSON.stringify({
      name: 'web',
      projectType: 'application',
      root: 'product/apps/web',
      tags: ['type:app'],
    }),
  )
  await writeFile(
    join(root, 'product/packages/ui/package.json'),
    JSON.stringify({ name: '@fixture/ui' }),
  )
  await writeFile(
    join(root, 'product/packages/ui/project.json'),
    JSON.stringify({
      name: 'ui',
      projectType: 'library',
      root: 'product/packages/ui',
      tags: ['type:library'],
    }),
  )
  await writeFile(
    join(root, 'product/packages/osu-skin-core/package.json'),
    JSON.stringify({ name: '@fixture/osu-skin-core' }),
  )
  await writeFile(
    join(root, 'product/packages/osu-skin-core/project.json'),
    JSON.stringify({
      name: 'osu-skin-core',
      projectType: 'library',
      root: 'product/packages/osu-skin-core',
      tags: ['type:library', 'runtime:pure'],
    }),
  )
  return root
}

test('flags package imports that reach into app code', async () => {
  const root = await makeFixture()
  await writeFile(join(root, 'product/apps/web/src/view.ts'), 'export const view = 1\n')
  await writeFile(
    join(root, 'product/packages/ui/src/button.ts'),
    "import { view } from '../../../apps/web/src/view'\nexport { view }\n",
  )

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ ruleName: 'package-to-app' }),
      expect.objectContaining({ ruleName: 'library-to-app' }),
    ]),
  )
})

test('flags runtime imports from osu-skin-core source', async () => {
  const root = await makeFixture()
  await writeFile(
    join(root, 'product/packages/osu-skin-core/src/index.ts'),
    "import React from 'react'\nexport { React }\n",
  )

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual([
    expect.objectContaining({ ruleName: 'runtime-pure', to: 'react' }),
  ])
})

test('flags app imports that reach into another route-local feature', async () => {
  const root = await makeFixture()
  await mkdir(join(root, 'product/apps/web/src/app/api/editor/[collection]'), {
    recursive: true,
  })
  await mkdir(join(root, 'product/apps/web/src/app/[locale]/(admin)/editor/_features'), {
    recursive: true,
  })
  await writeFile(
    join(root, 'product/apps/web/src/app/[locale]/(admin)/editor/_features/session.ts'),
    'export const session = 1\n',
  )
  await writeFile(
    join(root, 'product/apps/web/src/app/api/editor/[collection]/route.ts'),
    "import { session } from '@/app/[locale]/(admin)/editor/_features/session'\nexport { session }\n",
  )

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual([
    expect.objectContaining({ ruleName: 'route-local-feature' }),
  ])
})

test('flags bound css imports', async () => {
  const root = await makeFixture()
  await writeFile(
    join(root, 'product/apps/web/src/bad-css.ts'),
    "import styles from './styles.css'\nexport { styles }\n",
  )
  await writeFile(join(root, 'product/apps/web/src/styles.css.ts'), 'export const css = 1\n')

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual([
    expect.objectContaining({ ruleName: 'css-import-only' }),
  ])
})

test('flags source import cycles', async () => {
  const root = await makeFixture()
  await writeFile(
    join(root, 'product/apps/web/src/a.ts'),
    "import { b } from './b'\nexport const a = b\n",
  )
  await writeFile(
    join(root, 'product/apps/web/src/b.ts'),
    "import { a } from './a'\nexport const b = a\n",
  )

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual([
    expect.objectContaining({ ruleName: 'import-cycle' }),
  ])
})
