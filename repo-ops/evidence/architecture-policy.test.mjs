import assert from 'node:assert/strict'
import { spawnSync, execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const collector = fileURLToPath(new URL('./architecture-evidence.mjs', import.meta.url))
const dependencies = fileURLToPath(new URL('../../node_modules', import.meta.url))
const lib = 'product/packages/example/src/'
const ui = 'product/packages/ui/src/'

function check(files) {
  const root = mkdtempSync(join(tmpdir(), 'module-policy-'))
  try {
    for (const [name, content] of Object.entries({ 'package.json': '{}', ...files })) {
      const target = join(root, name)
      mkdirSync(dirname(target), { recursive: true })
      writeFileSync(target, content)
    }
    execFileSync('git', ['init', '-q'], { cwd: root })
    execFileSync('git', ['add', '.'], { cwd: root })
    execFileSync('git', ['-c', 'user.name=fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'], { cwd: root })
    symlinkSync(dependencies, join(root, 'node_modules'), 'dir')
    const result = spawnSync(process.execPath, [collector, root, '--check-static-product'], { cwd: root, encoding: 'utf8' })
    assert.equal(result.error, undefined)
    return { status: result.status, output: result.stdout + result.stderr, wroteReport: existsSync(join(root, '--check-static-product')) }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('rejects a static module cycle inside one project', () => {
  const result = check({
    [lib + 'a.ts']: "import './b'",
    [lib + 'b.ts']: "export * from './a'",
  })
  assert.equal(result.status, 1)
  assert.match(result.output, /Circular static product modules/)
  assert.ok(result.output.includes(lib + 'a.ts'))
  assert.ok(result.output.includes(lib + 'b.ts'))
})

test('allows a shared dependency, type-only cycle and deferred import', () => {
  const result = check({
    [lib + 'a.ts']: "import './shared'; import type { B } from './b'; export type A = B",
    [lib + 'b.ts']: "import './shared'; import type { A } from './a'; export type B = { a?: A }; export const lazy = () => import('./a')",
    [lib + 'shared.ts']: 'export const value = 1',
    [lib + 'shared.test.ts']: "import './a'",
  })
  assert.equal(result.status, 0, result.output)
  assert.equal(result.wroteReport, false)
})

test('rejects generic UI reaching supporting UI through a barrel', () => {
  const result = check({
    [ui + 'generic/components/button.ts']: "import '../../index'",
    [ui + 'index.ts']: "export * from './supporting/components/editorial'",
    [ui + 'supporting/components/editorial.ts']: 'export const editorial = 1',
  })
  assert.equal(result.status, 1)
  assert.match(result.output, /Generic UI depends on supporting UI/)
  assert.ok(result.output.includes(ui + 'index.ts'))
})

test('allows supporting UI to consume generic UI', () => {
  const result = check({
    [ui + 'generic/components/button.ts']: 'export const button = 1',
    [ui + 'supporting/components/editorial.ts']: "import '../../generic/components/button'",
  })
  assert.equal(result.status, 0, result.output)
})

test('rejects runtime product imports of repo-ops', () => {
  const result = check({
    [lib + 'a.ts']: "import '../../../../repo-ops/unsafe.mjs'",
    'repo-ops/unsafe.mjs': 'export const unsafe = true',
  })
  assert.equal(result.status, 1)
  assert.match(result.output, /Forbidden product runtime imports of repo-ops/)
})
