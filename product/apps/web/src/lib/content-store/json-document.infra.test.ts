import { describe, expect, test } from 'bun:test'
import { z } from 'zod'
import { loadJsonCollection, saveJsonCollection } from './json-document.infra'
import { createContentVersion } from './content-version.infra'
import { StorageVersionConflictError } from './content-store.domain'

describe('JSON collection optimistic versions', () => {
  test('an absent collection displays defaults and its initial save succeeds', async () => {
    let content: string | null = null
    const load = async () =>
      content === null
        ? null
        : { content, path: 'links.json', sha: 'sha', size: content.length }
    const storage = {
      load,
      loadFresh: load,
      async save(
        _path: string,
        next: string,
        options?: { expectedVersion?: string },
      ) {
        if (
          options?.expectedVersion !==
          createContentVersion((content ?? '').trimEnd())
        ) {
          throw new StorageVersionConflictError('conflict')
        }
        content = next
      },
    }
    const parse = (raw: unknown) => z.array(z.string()).parse(raw)
    const initial = await loadJsonCollection(
      'links.json',
      parse,
      () => ['default link'],
      storage,
    )
    expect(initial.collection).toEqual(['default link'])
    expect(initial.version).toBe(createContentVersion(''))
    const saved = await saveJsonCollection(
      'links.json',
      '["first link"]',
      parse,
      initial.version,
      storage,
    )
    const loaded = await loadJsonCollection(
      'links.json',
      parse,
      () => [],
      storage,
    )
    expect(loaded.collection).toEqual(['first link'])
    expect(loaded.version).toBe(saved.version)
    await expect(
      saveJsonCollection(
        'links.json',
        '["stale draft"]',
        parse,
        initial.version,
        storage,
      ),
    ).rejects.toBeInstanceOf(StorageVersionConflictError)
    expect(loaded.collection).toEqual(['first link'])
  })
})
