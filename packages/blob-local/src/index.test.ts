import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createBlobLocalStore } from './index'

const cleanupDirs: string[] = []

afterEach(async () => {
  await Promise.all(
    cleanupDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  )
})

async function makeStore() {
  const dir = await mkdtemp(path.join(tmpdir(), 'blob-local-'))
  cleanupDirs.push(dir)
  return createBlobLocalStore({ rootDir: dir })
}

describe('blob-local', () => {
  test('put/get/head roundtrip text content', async () => {
    const store = await makeStore()

    const written = await store.put('editor/notes.json', '{"ok":true}\n', {
      allowOverwrite: true,
    })
    const fetched = await store.get('editor/notes.json')
    const head = await store.head('editor/notes.json')

    expect(written.pathname).toBe('editor/notes.json')
    expect(await fetched?.text()).toBe('{"ok":true}\n')
    expect(head?.size).toBeGreaterThan(0)
  })

  test('list filters by prefix', async () => {
    const store = await makeStore()

    await store.put('editor/notes.json', '{}', { allowOverwrite: true })
    await store.put('blog/post-a.mdx', '---\n---\n', { allowOverwrite: true })

    const { blobs } = await store.list({ prefix: 'editor/' })

    expect(blobs.map((blob) => blob.pathname)).toEqual(['editor/notes.json'])
  })

  test('copy duplicates content without removing the source blob', async () => {
    const store = await makeStore()

    await store.put('blog/original.mdx', '# hello', { allowOverwrite: true })
    await store.copy('blog/original.mdx', 'blog/copied.mdx', { allowOverwrite: true })

    expect(await (await store.get('blog/original.mdx'))?.text()).toBe('# hello')
    expect(await (await store.get('blog/copied.mdx'))?.text()).toBe('# hello')
  })

  test('del removes one or many blobs', async () => {
    const store = await makeStore()

    await store.put('editor/a.json', '{}', { allowOverwrite: true })
    await store.put('editor/b.json', '{}', { allowOverwrite: true })

    await store.del(['editor/a.json', 'editor/b.json'])

    expect(await store.get('editor/a.json')).toBeNull()
    expect(await store.get('editor/b.json')).toBeNull()
  })
})
