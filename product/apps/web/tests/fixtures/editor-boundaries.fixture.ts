import assert from 'node:assert/strict'
import { mock } from 'bun:test'
import { NextRequest } from 'next/server'
import { StorageVersionConflictError } from '@/lib/content-store/content-store.domain'
import { createContentVersion } from '@/lib/content-store/content-version.infra'

let authenticated = false
let writes = 0
let conflict = false
let refreshFails = false
let sameOrigin = true
let blogVersion: unknown
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
mock.module('@/app/[locale]/(main)/notes/_features/notes.infra', () => ({
  loadNotesState: loadCollection,
  saveNotesState: save,
}))
mock.module('@/features/links/links.infra', () => ({
  loadLinksState: loadCollection,
  saveLinksState: save,
}))
mock.module('@/app/[locale]/(main)/blog/_features/blog.infra', () => ({
  loadBlogPostsState: loadCollection,
  saveBlogPostState: async (
    _slug: string,
    _metadata: unknown,
    _body: string,
    version: string,
  ) => {
    blogVersion = version
    return save()
  },
}))
mock.module('@/features/content-editor/scrap-editor.assemble', () => ({
  executeScrapEditorCommand: save,
  loadScrapEditorIndexState: loadCollection,
}))
mock.module('next/cache', () => ({
  revalidatePath: () => {},
  revalidateTag: () => {},
  updateTag: () => {
    if (refreshFails) throw new Error('refresh failed')
  },
}))
const { PUT, GET } = await import('@/app/api/editor/[collection]/route')
const { saveScrapAction } =
  await import('@/app/[locale]/(admin)/editor/_features/scraps.actions')
const { saveEditorCollectionAction, saveBlogPostAction } =
  await import('@/app/[locale]/(admin)/editor/_features/actions')
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
assert.equal((await saveBlogPostAction({}, blogForm)).error, 'conflict')
assert.equal(blogVersion, createContentVersion(''))
blogForm.set('expectedVersion', 'existing-blog-version')
assert.equal((await saveBlogPostAction({}, blogForm)).error, 'conflict')
assert.equal(blogVersion, 'existing-blog-version')

const scrapForm = new FormData()
for (const [key, value] of Object.entries({
  kind: 'create',
  slug: 'test-scrap',
  locale: 'ja',
  title: 'A draft',
  hypothesis: 'Question',
  summary: '',
  tags: 'research',
  status: 'open',
  lead: 'Lead draft',
}))
  scrapForm.set(key, value)
const scrapConflict = await saveScrapAction({ status: 'idle' }, scrapForm)
assert.equal(scrapConflict.status, 'error')
assert.equal(scrapForm.get('lead'), 'Lead draft')
authenticated = false
await assert.rejects(
  saveScrapAction({ status: 'idle' }, scrapForm),
  /unauthorized/,
)
await assert.rejects(
  saveEditorCollectionAction({ status: 'idle' }, collectionForm),
  /unauthorized/,
)
await assert.rejects(saveBlogPostAction({}, new FormData()), /unauthorized/)
assert.equal(writes, 0)
authenticated = true
conflict = false
sameOrigin = false
await assert.rejects(
  saveScrapAction({ status: 'idle' }, scrapForm),
  /forbidden/,
)
await assert.rejects(
  saveEditorCollectionAction({ status: 'idle' }, collectionForm),
  /forbidden/,
)
await assert.rejects(saveBlogPostAction({}, new FormData()), /forbidden/)
assert.equal(writes, 0)
sameOrigin = true
refreshFails = true
const result = await saveScrapAction({ status: 'idle' }, scrapForm)
assert.equal(result.status, 'saved')
assert.equal(writes, 1)
assert.ok(
  result.status === 'saved' && result.message.includes('refresh failed'),
)
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
