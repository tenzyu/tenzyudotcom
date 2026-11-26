import assert from 'node:assert/strict'
import { mock } from 'bun:test'

// Deliberately simulate inherited production credentials in a Preview process.
// No real credentials, network, or deployment are involved.
Object.assign(process.env, {
  NODE_ENV: 'production',
  VERCEL: '1',
  VERCEL_ENV: 'preview',
  VERCEL_TARGET_ENV: 'preview',
  EDITOR_ADMIN_PASSWORD: 'synthetic-password',
  EDITOR_SESSION_SECRET: 'synthetic-secret-not-a-credential-0001',
  EDITOR_ALLOWED_ORIGIN: 'https://tenzyu.com',
  GITHUB_CONTENT_OWNER: 'fixture',
  GITHUB_CONTENT_REPO: 'editor',
  GITHUB_CONTENT_BRANCH: 'main',
  GITHUB_CONTENT_TOKEN: 'synthetic-token',
})
const { serializeSession } = await import('../../src/features/editor-auth/session-token')
const token = serializeSession({ sub: 'editor-admin', exp: Date.now() + 60_000 },
  process.env.EDITOR_SESSION_SECRET!)
let cookieWrites = 0
let outbound = 0
globalThis.fetch = (async () => {
  outbound++
  throw new Error('Unexpected network access')
}) as typeof fetch
mock.module('next/headers', () => ({
  cookies: async () => ({
    get: () => ({ value: token }),
    set: () => { cookieWrites++ },
  }),
  headers: async () => new Headers({ origin: 'https://tenzyu.com' }),
}))
const { getEditorAdminSessionExpiry, verifyEditorAdminPassword, createEditorAdminSession,
  requireEditorSameOriginRequest, isSameOriginEditorRequest } = await import('../../src/features/editor-auth/editor-session')
const { githubContentRepository, saveGitHubTextFile } = await import('../../src/platform/content-store/github-content.infra')
assert.equal(await getEditorAdminSessionExpiry(), null)
assert.equal(verifyEditorAdminPassword('synthetic-password'), false)
await assert.rejects(createEditorAdminSession(), /disabled/)
await assert.rejects(requireEditorSameOriginRequest(), /disabled/)
assert.equal(isSameOriginEditorRequest(new Request('https://tenzyu.com/api/editor/notes', {
  method: 'POST', headers: { origin: 'https://tenzyu.com', 'x-forwarded-host': 'tenzyu.com' },
})), false)
await assert.rejects(saveGitHubTextFile('editor/notes.json', '[]'), /disabled/)
await assert.rejects(githubContentRepository.saveJson('editor/notes.json', []), /disabled/)
await assert.rejects(githubContentRepository.delete('editor/notes.json'), /disabled/)
assert.throws(() => githubContentRepository.commit('a'.repeat(40), [], 'fixture'), /disabled/)
assert.equal(cookieWrites, 0)
assert.equal(outbound, 0)
