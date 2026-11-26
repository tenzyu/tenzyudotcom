import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { createRequire } from 'node:module'
import { collectSymbolEvidence } from './symbol-evidence.mjs'

const ts = createRequire(import.meta.url)('typescript')

test('resolves aliases, re-exports and shadowed names without treating imports as use', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'symbol-evidence-'))
  const prefix = 'product/packages/example/'
  const sources = {
    [prefix + 'tsconfig.json']: JSON.stringify({ compilerOptions: { strict: true, target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', types: [] }, include: ['src'] }),
    [prefix + 'src/owner.ts']: 'export const authority = 1; export const unused = 2; export type Model = { n: number }',
    [prefix + 'src/barrel.ts']: "export { authority as publicAuthority, unused } from './owner'",
    [prefix + 'src/consumer.ts']: "import { publicAuthority as value, unused } from './barrel'; import type { Model } from './owner'; const n: Model = { n: value }; function local(value: number) { return value }; export const record = { value, n }; export const result = local(3)",
    [prefix + 'unconfigured.js']: 'void 0',
  }
  try {
    for (const [file, contents] of Object.entries(sources)) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      fs.writeFileSync(path.join(root, file), contents)
    }
    const result = collectSymbolEvidence(ts, root, Object.keys(sources))
    const project = result.projects[0]
    assert.equal(project.status, 'checked', JSON.stringify(project.diagnostics))
    const exported = project.exports.find(row => row.name === 'publicAuthority')
    assert.equal(exported.targets[0].file, prefix + 'src/owner.ts')
    const refs = project.references.filter(row => row.from.file.endsWith('/consumer.ts'))
    assert.equal(refs.filter(row => row.name === 'value' && row.targets.some(target => target.file.endsWith('/owner.ts'))).length, 2)
    assert.ok(refs.some(row => row.name === 'value' && row.targets.some(target => target.file.endsWith('/consumer.ts'))))
    assert.ok(refs.some(row => row.name === 'Model' && row.targets.some(target => target.file.endsWith('/owner.ts'))))
    assert.ok(!refs.some(row => row.name === 'unused'))
    assert.deepEqual(result.uncovered, [prefix + 'unconfigured.js'])
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})

test('keeps project aliases separate and identifies emitted declaration consumers', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'symbol-projects-'))
  const compilerOptions = { strict: true, target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', types: [], paths: { '@/*': ['./src/*'] } }
  const config = JSON.stringify({ compilerOptions, include: ['src'] })
  const a = 'product/apps/a/', b = 'product/apps/b/', lib = 'product/packages/library/'
  const sources = {
    [a + 'tsconfig.json']: config,
    [b + 'tsconfig.json']: config,
    [a + 'src/value.ts']: 'export const value = 1',
    [b + 'src/value.ts']: 'export const value = 2',
    [a + 'src/main.ts']: "import { value } from '@/value'; import { publicValue } from '@fixture/library'; export const result = value + publicValue",
    [b + 'src/main.ts']: "import { value } from '@/value'; export const result = value",
    [lib + 'package.json']: JSON.stringify({ name: '@fixture/library', exports: { '.': { types: './dist/index.d.ts' } } }),
  }
  try {
    for (const [file, contents] of Object.entries({ ...sources, [lib + 'dist/index.d.ts']: 'export declare const publicValue: number' })) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
      fs.writeFileSync(path.join(root, file), contents)
    }
    fs.mkdirSync(path.join(root, 'node_modules/@fixture'), { recursive: true })
    fs.symlinkSync(path.join(root, lib), path.join(root, 'node_modules/@fixture/library'), 'dir')
    const result = collectSymbolEvidence(ts, root, Object.keys(sources))
    for (const project of result.projects) assert.equal(project.status, 'checked', JSON.stringify(project.diagnostics))
    for (const prefix of [a, b]) {
      const project = result.projects.find(row => row.config === prefix + 'tsconfig.json')
      assert.ok(project.references.some(row => row.from.file === prefix + 'src/main.ts' && row.name === 'value' && row.targets[0].file === prefix + 'src/value.ts'))
    }
    const consumer = result.projects.find(row => row.config === a + 'tsconfig.json')
    assert.ok(consumer.references.some(row => row.name === 'publicValue' && row.targets[0].file === lib + 'dist/index.d.ts' && !row.targets[0].tracked))
    assert.deepEqual(consumer.generatedDeclarations, [lib + 'dist/index.d.ts'])
  } finally { fs.rmSync(root, { recursive: true, force: true }) }
})
