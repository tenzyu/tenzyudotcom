import assert from 'node:assert/strict'
import { mock } from 'bun:test'
import { NextRequest } from 'next/server'
import type { BlogSaveCommand } from '../../src/features/blog/blog.domain'
import { StorageVersionConflictError, StorageDocumentWriteUncertainError } from '../../src/platform/content-store/content-store.domain'

let authenticated = false
let writes = 0
let conflict = false
let sameOrigin = true
let uncertain = false
let refreshFails = false
let itemResult: 'saved' | 'conflict' | 'unknown' | 'unchanged' = 'saved'
let itemCalls = 0
let itemOperations: string[] = []
const invalidations: Array<{ tag: string; options: unknown }> = []
const blogCommands: BlogSaveCommand[] = []
mock.module('@/features/editor-auth/editor-session', () => ({
  hasEditorAdminSession: async () => authenticated,
  getEditorAdminSessionExpiry: async () => authenticated ? Date.now() + 60_000 : null,
  isSameOriginEditorRequest: (request: Request) =>
    request.headers.get('origin') === 'http://localhost',
  requireEditorSameOriginRequest: async () => {
    if (!sameOrigin) throw new Error('forbidden')
  },
  requireEditorAdminSession: async () => {
    if (!authenticated) throw new Error('unauthorized')
  },
  clearEditorAdminSession: async () => {},
  checkEditorLoginRateLimit: async () => true,
  clearEditorLoginRateLimit: async () => {},
  createEditorAdminSession: async () => {},
  verifyEditorAdminPassword: () => false,
}))
async function save() {
  if (conflict) throw new StorageVersionConflictError('conflict')
  if (uncertain) throw new StorageDocumentWriteUncertainError('unknown outcome')
  writes++
  return { version: 'new-version', slug: 'test-scrap' }
}
const loadCollection = async () => ({
  collection: [],
  serialized: '[]',
  version: 'old',
})
mock.module('@/features/notes/notes.infra', () => ({
  NOTES_STORAGE_PATH: 'editor/notes.json',
  parseNoteSourceEntries: () => [],
  loadNotesState: loadCollection,
  saveNotesState: save,
}))
mock.module('@/features/links/links.infra', () => ({
  loadLinksState: loadCollection,
  saveLinksState: save,
}))
mock.module('../../src/features/blog/blog.infra', () => ({
  loadBlogPostsState: loadCollection,
  saveBlogPost: async (command: BlogSaveCommand) => {
    blogCommands.push(command)
    await save()
    return {
      commitOid: 'a'.repeat(40),
      headOid: 'a'.repeat(40),
      status: 'written',
    }
  },
}))
mock.module('../../src/platform/content-store/github-content.infra', () => ({
  githubContentRepository: { reconcile: async () => null },
}))
mock.module('../../src/features/scraps/editor/scrap-editor.assemble', () => ({
  executeScrapEditorCommand: save,
  loadScrapEditorIndexState: loadCollection,
  loadScrapEditorIndex: async () => [],
  loadScrapEditorState: async () => null,
  checkScrapPublication: async () => 'uncertain',
}))
mock.module('@/platform/content-store/json-item-command.infra', () => ({
  loadItemDocument: async () => { throw new Error('Unexpected item read') },
  requireItem: () => { throw new Error('Unexpected item lookup') },
  executeItemCommand: async (input: { pathname: string; operation: string }) => {
    assert.equal(input.pathname, 'editor/links.json')
    itemCalls++
    itemOperations.push(input.operation)
    return itemResult === 'saved'
      ? { kind: 'saved', version: 'item-version' }
      : { kind: itemResult }
  },
}))
mock.module('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: (tag: string, options: unknown) => {
    invalidations.push({ tag, options })
    if (refreshFails) throw new Error('fixture cache failure')
  },
  updateTag: () => {},
}))
const { PUT, GET } = await import('@/app/api/editor/[collection]/route')
const { POST: postScrap } = await import('@/app/api/editor/scrap/route')
const { saveNotesCollectionAction } = await import('@/features/notes/editor/notes-actions')
const { saveLinksCollectionAction } = await import('@/features/links/editor/links-actions')
const { POST: postItem } = await import('@/app/api/editor/[collection]/item/route')
const { saveBlogPostAction } = await import('@/features/blog/editor/blog-actions')
const params = { params: Promise.resolve({ collection: 'notes' }) }
const request = (
  origin = 'http://localhost',
  payload: unknown = { sourceJson: '[]', expectedVersion: 'old' },
) =>
  new NextRequest('http://localhost/api/editor/notes', {
    method: 'PUT',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })

assert.equal((await PUT(request(), params)).status, 401)
assert.equal((await GET(request(), params)).status, 401)
authenticated = true
assert.equal((await PUT(request('http://other.test'), params)).status, 403)
assert.equal(
  (await PUT(request('http://localhost', { sourceJson: '[]' }), params)).status,
  400,
)
for (const collection of ['pointers', 'puzzles', 'recommendations']) {
  assert.equal(
    (await PUT(request(), { params: Promise.resolve({ collection }) })).status,
    404,
  )
}
assert.equal(writes, 0)
conflict = true
assert.equal((await PUT(request(), params)).status, 409)
const collectionForm = new FormData()
for (const [key, value] of Object.entries({
  locale: 'ja',
  collectionId: 'notes',
  sourceJson: '[]',
  expectedVersion: 'old',
}))
  collectionForm.set(key, value)
assert.equal(
  (await saveNotesCollectionAction({ status: 'idle' }, collectionForm)).status,
  'error',
)
assert.equal(writes, 0)

const blogForm = new FormData()
for (const [key, value] of Object.entries({
  locale: 'ja',
  slug: 'first-post',
  title: 'Draft title',
  summary: 'Draft summary',
  body: 'Draft body',
  tags: '',
  publishedAt: '2026-01-01T12:00:00Z',
}))
  blogForm.set(key, value)
const idle = { status: 'idle' } as const
const createConflict = await saveBlogPostAction(idle, blogForm)
assert.equal(
  createConflict.status === 'error' && createConflict.error,
  'conflict',
)
assert.equal(blogCommands[0].intent, 'create')
blogForm.set('expectedVersion', 'existing-blog-version')
const legacyConflict = await saveBlogPostAction(idle, blogForm)
assert.equal(
  legacyConflict.status === 'error' && legacyConflict.error,
  'conflict',
)
assert.equal(blogCommands.length, 1)
const oid = 'b'.repeat(40)
blogForm.set('intent', 'edit')
blogForm.set('changes', '{}')
blogForm.set('expectedVersion', oid)
const editConflict = await saveBlogPostAction(idle, blogForm)
assert.equal(editConflict.status === 'error' && editConflict.error, 'conflict')
assert.deepEqual(blogCommands[1], {
  slug: 'first-post',
  intent: 'edit',
  expectedVersion: oid,
  changes: {},
})

const scrapCommand = {
  kind: 'create', slug: 'test-scrap', locale: 'ja',
  title: 'A draft', hypothesis: 'Question', summary: '',
  tags: ['research'], status: 'open', published: false, lead: 'Lead draft',
}
const scrapRequest = (origin = 'http://localhost') =>
  new NextRequest('http://localhost/api/editor/scrap', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({ operation: 'save', command: scrapCommand }),
  })
assert.equal((await postScrap(scrapRequest())).status, 409)
authenticated = false
assert.equal((await postScrap(scrapRequest())).status, 401)
await assert.rejects(
  saveNotesCollectionAction({ status: 'idle' }, collectionForm),
  /unauthorized/,
)
await assert.rejects(saveBlogPostAction(idle, new FormData()), /unauthorized/)
assert.equal(writes, 0)
authenticated = true
conflict = false
sameOrigin = false
assert.equal((await postScrap(scrapRequest('http://other.test'))).status, 403)
await assert.rejects(
  saveNotesCollectionAction({ status: 'idle' }, collectionForm),
  /forbidden/,
)
await assert.rejects(saveBlogPostAction(idle, new FormData()), /forbidden/)
assert.equal(writes, 0)
sameOrigin = true
const result = await postScrap(scrapRequest())
assert.equal(result.status, 200)
assert.deepEqual(await result.json(), { kind: 'saved', version: 'new-version' })
assert.equal(writes, 1)
assert.deepEqual(invalidations, [])
for (const collection of ['blog', 'scraps'])
  assert.equal(
    (await PUT(request(), { params: Promise.resolve({ collection }) })).status,
    405,
  )
for (const collection of ['links', 'notes'])
  assert.equal(
    (await PUT(request(), { params: Promise.resolve({ collection }) })).status,
    200,
  )
assert.equal(writes, 3)
assert.deepEqual(invalidations, [
  { tag: 'content:editor:links', options: { expire: 0 } },
])

const linkParams = { params: Promise.resolve({ collection: 'links' }) }
const linkForm = new FormData()
for (const [key, value] of collectionForm) linkForm.set(key, value)
linkForm.set('collectionId', 'links')
const itemRequest = (operation: 'apply' | 'check' = 'apply', origin = 'http://localhost') =>
  new NextRequest('http://localhost/api/editor/links/item', {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify({
      base: { version: 'c'.repeat(64), revision: 'd'.repeat(40) },
      operation,
      command: {
        kind: 'create',
        link: { name: 'Fixture', id: 'fixture', url: 'https://example.test', shortenUrl: 'fixture', icon: 'link', category: 'Social' },
        before: null,
      },
    }),
  })
const cacheCall = { tag: 'content:editor:links', options: { expire: 0 } }
invalidations.length = 0
const beforeWrites = writes
authenticated = false
assert.equal((await PUT(request(), linkParams)).status, 401)
assert.equal((await postItem(itemRequest(), linkParams)).status, 401)
await assert.rejects(saveLinksCollectionAction(idle, linkForm), /unauthorized/)
authenticated = true
sameOrigin = false
assert.equal((await PUT(request('http://other.test'), linkParams)).status, 403)
assert.equal((await postItem(itemRequest('apply', 'http://other.test'), linkParams)).status, 403)
await assert.rejects(saveLinksCollectionAction(idle, linkForm), /forbidden/)
sameOrigin = true
assert.equal((await saveLinksCollectionAction(idle, collectionForm)).status, 'error')
assert.equal((await saveNotesCollectionAction(idle, linkForm)).status, 'error')
conflict = true
assert.equal((await PUT(request(), linkParams)).status, 409)
const linkConflict = await saveLinksCollectionAction(idle, linkForm)
assert.equal(linkConflict.status === 'error' && linkConflict.error, 'conflict')
conflict = false
uncertain = true
const linkUncertain = await saveLinksCollectionAction(idle, linkForm)
assert.equal(linkUncertain.status === 'error' && linkUncertain.error, 'uncertain')
uncertain = false
assert.equal(writes, beforeWrites)
assert.equal(itemCalls, 0)
assert.deepEqual(invalidations, [])
for (const kind of ['conflict', 'unknown', 'unchanged'] as const) {
  itemResult = kind
  const response = await postItem(itemRequest(kind === 'unchanged' ? 'check' : 'apply'), linkParams)
  assert.equal(response.status, kind === 'conflict' ? 409 : 200)
  assert.deepEqual(await response.json(), { kind })
}
assert.deepEqual(invalidations, [])
assert.equal(itemCalls, 3)
itemResult = 'saved'
const checked = await postItem(itemRequest('check'), linkParams)
assert.equal(checked.status, 200)
assert.deepEqual(await checked.json(), { kind: 'saved', version: 'item-version' })
assert.deepEqual(invalidations, [cacheCall])
assert.equal(itemCalls, 4)
assert.deepEqual(itemOperations, ['apply', 'apply', 'check', 'check'])

refreshFails = true
const originalError = console.error
const logged: unknown[][] = []
console.error = (...args: unknown[]) => { logged.push(args) }
try {
  const confirmed = await PUT(request(), linkParams)
  assert.equal(confirmed.status, 200)
  assert.equal((await confirmed.json()).version, 'new-version')
  const actionResult = await saveLinksCollectionAction(idle, linkForm)
  assert.equal(actionResult.status, 'saved')
  const item = await postItem(itemRequest(), linkParams)
  assert.equal(item.status, 200)
  assert.deepEqual(await item.json(), { kind: 'saved', version: 'item-version' })
} finally {
  console.error = originalError
}
assert.equal(writes, beforeWrites + 2)
assert.equal(itemCalls, 5)
assert.equal(logged.length, 3)
assert.deepEqual(invalidations, [cacheCall, cacheCall, cacheCall, cacheCall])
