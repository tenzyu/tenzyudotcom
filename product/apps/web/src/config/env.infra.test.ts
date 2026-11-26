import { expect, test } from 'bun:test'
import { isEditorDeploymentAllowed, isEditorLoginConfigured } from './env.infra'

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

test('deployment authorization fails closed for Vercel previews, custom targets and missing metadata', () => {
  const local = {
    nodeEnv: 'production' as const,
    vercel: undefined,
    vercelEnv: undefined,
    vercelTargetEnv: undefined,
    editorAllowedOrigin: 'http://127.0.0.1:4174',
  }
  const production = { ...local, vercel: '1', vercelEnv: 'production', vercelTargetEnv: 'production' }
  expect(isEditorDeploymentAllowed(production)).toBe(true)
  expect(isEditorDeploymentAllowed(local)).toBe(true)
  expect(isEditorDeploymentAllowed({ ...local, nodeEnv: 'development', editorAllowedOrigin: undefined })).toBe(true)
  for (const config of [
    { ...production, vercelEnv: 'preview', vercelTargetEnv: 'preview' },
    { ...production, vercelTargetEnv: 'staging' },
    { ...production, vercelEnv: 'development', nodeEnv: 'development' as const },
    { ...production, vercelTargetEnv: undefined },
    { ...production, vercel: undefined },
    { ...local, editorAllowedOrigin: undefined },
    { ...local, editorAllowedOrigin: 'https://tenzyu.com' },
    { ...local, editorAllowedOrigin: 'http://127.0.0.1.evil.example' },
    { ...local, editorAllowedOrigin: 'http://localhost/path' },
  ]) {
    expect(isEditorDeploymentAllowed(config)).toBe(false)
  }
})
