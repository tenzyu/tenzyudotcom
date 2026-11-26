import { expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const policy = fileURLToPath(new URL('./check-dependency-policy.ts', import.meta.url))
const catalog = Object.fromEntries(['typescript','react','react-dom','@types/react','@types/react-dom','vite','tailwindcss','@tailwindcss/postcss'].map(name => [name,'1.0.0']))
const nodes = {
  web: { data: { root: 'product/apps/web', tags: ['type:app'] } },
  pure: { data: { root: 'product/packages/pure', tags: ['runtime:pure'] } },
  other: { data: { root: 'product/packages/other', tags: ['runtime:pure'] } },
  server: { data: { root: 'product/packages/server', tags: ['runtime:server'] } },
  publishing: { data: { root: 'product/packages/publishing', tags: ['domain:publishing'] } },
  ui: { data: { root: 'product/packages/ui', tags: ['domain:design-system'] } },
  ops: { data: { root: 'repo-ops' } },
}

function check(source: string, target: string) {
  const dir = mkdtempSync(join(tmpdir(), 'dependency-policy-'))
  try {
    writeFileSync(join(dir,'package.json'), JSON.stringify({ packageManager: 'bun@1.4.5', workspaces: { catalog } }))
    const graph = join(dir,'graph.json')
    writeFileSync(graph, JSON.stringify({ graph: { nodes, dependencies: { [source]: [{ source, target }] } } }))
    const result = Bun.spawnSync([process.execPath, policy, graph], { cwd: dir })
    return { code: result.exitCode, stderr: result.stderr.toString() }
  } finally { rmSync(dir, { recursive: true, force: true }) }
}

test('allowed app-to-package and pure-to-pure edges remain valid', () => {
  expect(check('web','pure').code).toBe(0)
  expect(check('pure','other').code).toBe(0)
  expect(check('web','npm:external').code).toBe(0)
})
test('forbidden workspace edges fail with the offending dependency', () => {
  for (const [from,to] of [['pure','server'],['pure','web'],['web','ops'],['ui','server'],['server','publishing']]) {
    const result = check(from!,to!)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain(`Forbidden workspace dependency: ${from} -> ${to}`)
  }
})
