import assert from 'node:assert/strict'
import { mock } from 'bun:test'
import { NextRequest } from 'next/server'
import type { BlogSaveCommand } from '@/app/[locale]/(main)/blog/_features/blog.domain'
import { StorageVersionConflictError } from '@/lib/content-store/content-store.domain'

let authenticated = false
let writes = 0
let conflict = false
let refreshFails = false
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
mock.module('@/lib/content-store/github-content.infra', () => ({
  githubContentRepository: { reconcile: async () => null },
}))
mock.module('@/features/content-editor/scrap-editor.assemble', () => ({
  executeScrapEditorCommand: save,
  loadScrapEditorIndexState: loadCollection,
}))
mock.module('next/cache', () => ({
  revalidatePath: (path: string) => {
    if (refreshFails && path === '/[locale]/editor/scraps') {
      throw new Error('refresh failed')
    }
  },
  revalidateTag: () => {},
  updateTag: () => {},
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
await assert.rejects(saveBlogPostAction(idle, new FormData()), /unauthorized/)
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
await assert.rejects(saveBlogPostAction(idle, new FormData()), /forbidden/)
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
