import { env, isEditorGithubStorage } from '@/config/env.infra'

export function isEditorLoginConfigured() {
  return !!env.editorAdminPassword && !!env.editorSessionSecret
}

export function getEditorStorageDriver() {
  return isEditorGithubStorage ? 'github' : 'unconfigured'
}

export function usesEditorGithubStorage() {
  return isEditorGithubStorage
}
