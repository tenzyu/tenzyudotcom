import assert from 'node:assert/strict'
import { mock } from 'bun:test'
import { NextRequest } from 'next/server'
import type { BlogSaveCommand } from '../../src/features/blog/blog.domain'
import { StorageVersionConflictError } from '../../src/platform/content-store/content-store.domain'

let authenticated = false
let writes = 0
let conflict = false
let sameOrigin = true
const blogCommands: BlogSaveCommand[] = []
mock.module('@/features/editor-auth/editor-session', () => ({
  hasEditorAdminSession: async () => authenticated,
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
  writes++
  return { version: 'new-version', slug: 'test-scrap' }
}
const loadCollection = async () => ({
  collection: [],
  serialized: '[]',
  version: 'old',
})
mock.module('@/features/notes/notes.infra', () => ({
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
mock.module('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
  updateTag: () => {},
}))
const { PUT, GET } = await import('@/app/api/editor/[collection]/route')
const { POST: postScrap } = await import('@/app/api/editor/scrap/route')
const { saveEditorCollectionAction, saveBlogPostAction } =
  await import('../../src/features/content-editor/actions')
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
  (await saveEditorCollectionAction({ status: 'idle' }, collectionForm)).status,
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
  saveEditorCollectionAction({ status: 'idle' }, collectionForm),
  /unauthorized/,
)
await assert.rejects(saveBlogPostAction(idle, new FormData()), /unauthorized/)
assert.equal(writes, 0)
authenticated = true
conflict = false
sameOrigin = false
assert.equal((await postScrap(scrapRequest('http://other.test'))).status, 403)
await assert.rejects(
  saveEditorCollectionAction({ status: 'idle' }, collectionForm),
  /forbidden/,
)
await assert.rejects(saveBlogPostAction(idle, new FormData()), /forbidden/)
assert.equal(writes, 0)
sameOrigin = true
const result = await postScrap(scrapRequest())
assert.equal(result.status, 200)
assert.deepEqual(await result.json(), { kind: 'saved', version: 'new-version' })
assert.equal(writes, 1)
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
