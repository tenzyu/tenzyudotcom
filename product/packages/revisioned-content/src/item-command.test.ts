import assert from 'node:assert/strict'
import { test } from 'bun:test'
import { createItemDocumentCommands, type ItemDocumentStorage } from './item-command'
import { StorageDocumentWriteUncertainError, StorageVersionConflictError } from './contracts'
import { createContentVersion } from './version'

const pathname = 'notes.json'
const serialize = (items: readonly number[]) => `${JSON.stringify(items, null, 2)}\n`
const initial = serialize([1])
const desired = serialize([1, 2])
const base = { revision: 'r0', version: createContentVersion(initial.trimEnd()) }
const saved = { kind: 'saved', version: createContentVersion(desired.trimEnd()) }

type Outcome = 'normal' | 'conflict' | 'uncertain-before' | 'uncertain-after' | 'uncertain-overwritten' | 'uncertain-read-fails' | 'hard-error'

function fixture(outcome: Outcome = 'normal') {
  const revisions = new Map([['r0', initial]])
  let head = 'r0'
  let readFails = false
  const writes: { bytes: string; expectedVersion?: string }[] = []
  const set = (bytes: string) => {
    head = `r${revisions.size}`
    revisions.set(head, bytes)
  }
  const storage: ItemDocumentStorage = {
    async snapshot() {
      if (readFails) throw new Error('read failed')
      return storage.snapshotAt(head)
    },
    snapshotAt(revision) {
      const content = revisions.get(revision)
      assert.notEqual(content, undefined)
      return { version: revision, async loadText(path) {
        assert.equal(path, pathname)
        return { content: content! }
      } }
    },
    async saveText(path, bytes, options) {
      assert.equal(path, pathname)
      writes.push({ bytes, expectedVersion: options?.expectedVersion })
      if (outcome === 'conflict') throw new StorageVersionConflictError('conflict')
      if (outcome === 'hard-error') throw new Error('hard failure')
      if (outcome === 'uncertain-before') throw new StorageDocumentWriteUncertainError('unknown')
      assert.equal(options?.expectedVersion, createContentVersion(revisions.get(head)!.trimEnd()))
      set(bytes)
      if (outcome === 'uncertain-overwritten') set(serialize([3]))
      if (outcome === 'uncertain-read-fails') readFails = true
      if (outcome !== 'normal') throw new StorageDocumentWriteUncertainError('unknown')
    },
  }
  const { executeItemCommand } = createItemDocumentCommands(storage)
  const execute = (operation: 'apply' | 'check', documentBase = base, change = (items: readonly number[]) => [...items, 2]) => executeItemCommand({
    pathname, operation, base: documentBase, change,
    parse(raw) {
      assert.ok(Array.isArray(raw) && raw.every(item => typeof item === 'number'))
      return raw as number[]
    },
  })
  return { execute, set, writes, current: () => revisions.get(head) }
}

test('apply sends canonical bytes and the expected version', async () => {
  const f = fixture()
  assert.deepEqual(await f.execute('apply'), saved)
  assert.deepEqual(f.writes, [{ bytes: desired, expectedVersion: base.version }])
  assert.equal(f.current(), desired)
})

test('stale apply and check never write', async () => {
  const f = fixture()
  assert.deepEqual(await f.execute('check'), { kind: 'unchanged' })
  f.set(serialize([3]))
  assert.deepEqual(await f.execute('apply'), { kind: 'conflict' })
  assert.deepEqual(await f.execute('check'), { kind: 'unknown' })
  assert.deepEqual(f.writes, [])
})

test('check recognizes a committed command from its historical base', async () => {
  const f = fixture()
  f.set(desired)
  assert.deepEqual(await f.execute('check'), saved)
  assert.deepEqual(f.writes, [])
})

test('check rejects an inconsistent historical base without writing', async () => {
  const f = fixture()
  f.set(serialize([3]))
  assert.deepEqual(await f.execute('check', { ...base, version: 'invalid' }), { kind: 'unknown' })
  assert.deepEqual(f.writes, [])
})

test('a no-op apply returns saved without writing', async () => {
  const f = fixture()
  assert.deepEqual(await f.execute('apply', base, items => [...items]), { kind: 'saved', version: base.version })
  assert.deepEqual(f.writes, [])
})

for (const [outcome, expected] of [
  ['conflict', { kind: 'conflict' }],
  ['uncertain-before', { kind: 'unknown' }],
  ['uncertain-after', saved],
  ['uncertain-overwritten', { kind: 'unknown' }],
  ['uncertain-read-fails', { kind: 'unknown' }],
] as const) {
  test(`${outcome}: reconcile without repeating a write`, async () => {
    const f = fixture(outcome)
    assert.deepEqual(await f.execute('apply'), expected)
    assert.equal(f.writes.length, 1)
  })
}

test('unexpected failures propagate instead of reporting success', async () => {
  const f = fixture('hard-error')
  await assert.rejects(f.execute('apply'), /hard failure/)
  assert.equal(f.writes.length, 1)
})
