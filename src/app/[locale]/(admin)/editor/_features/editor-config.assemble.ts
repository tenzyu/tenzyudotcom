import { env, isEditorBlobStorage } from '@/config/env.contract'

export function isEditorLoginConfigured() {
  return !!env.editorAdminPassword && !!env.editorSessionSecret
}

export function getEditorStorageDriver() {
  return env.editorStorageDriver
}

export function usesEditorBlobStorage() {
  return isEditorBlobStorage
}
