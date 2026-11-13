import { createHash } from 'node:crypto'

export function createContentVersion(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
