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
  return root
}

test('flags package imports that reach into app code', async () => {
  const root = await makeFixture()
  await writeFile(join(root, 'product/apps/web/src/view.ts'), 'export const view = 1\n')
  await writeFile(
    join(root, 'product/packages/ui/src/button.ts'),
    "import { view } from '../../../apps/web/src/view'\nexport { view }\n",
  )

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual([
    expect.objectContaining({ ruleName: 'package-to-app' }),
    expect.objectContaining({ ruleName: 'ui-app-boundary' }),
  ])
})

test('flags runtime imports from osu-skin-core source', async () => {
  const root = await makeFixture()
  await writeFile(
    join(root, 'product/packages/osu-skin-core/src/index.ts'),
    "import React from 'react'\nexport { React }\n",
  )

  expect(analyzeWorkspaceBoundaries({ projectRoot: root })).toEqual([
    expect.objectContaining({ ruleName: 'osu-skin-core-pure', to: 'react' }),
  ])
})
