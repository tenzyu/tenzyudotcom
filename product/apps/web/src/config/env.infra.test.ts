import { expect, test } from 'bun:test'
import { isEditorLoginConfigured } from './env.infra'

test('editor readiness requires a password and a signing secret of at least 32 characters', () => {
  const password = 'synthetic-password'
  const secret = 'x'.repeat(32)
  for (const config of [
    { editorAdminPassword: undefined, editorSessionSecret: secret },
    { editorAdminPassword: '', editorSessionSecret: secret },
    { editorAdminPassword: password, editorSessionSecret: undefined },
    { editorAdminPassword: password, editorSessionSecret: '' },
    { editorAdminPassword: password, editorSessionSecret: 'x'.repeat(31) },
  ]) {
    expect(isEditorLoginConfigured(config)).toBe(false)
  }
  expect(isEditorLoginConfigured({
    editorAdminPassword: password,
    editorSessionSecret: secret,
  })).toBe(true)
  expect(isEditorLoginConfigured({
    editorAdminPassword: password,
    editorSessionSecret: 'x'.repeat(64),
  })).toBe(true)
})
