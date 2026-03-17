import { existsSync } from 'node:fs'
import path from 'node:path'
import { env } from '@/config/env.infra'

function resolveCandidatePaths() {
  const candidates = [
    env.tenzyuStorageRoot,
    path.join(process.cwd(), 'storage'),
    path.resolve(process.cwd(), '../../storage'),
  ]

  return candidates.filter(
    (value): value is string => typeof value === 'string' && value.length > 0,
  )
}

export function getStorageRootDir() {
  for (const candidate of resolveCandidatePaths()) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return path.resolve(process.cwd(), '../../storage')
}
