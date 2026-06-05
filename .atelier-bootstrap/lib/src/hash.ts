import { createHash } from 'node:crypto'

/**
 * Compute the sha256 of a UTF-8 string.
 *
 * Atelier v0 uses sha256 for both `SourceRef.sha256` and
 * deterministic content hashing.
 */
export function sha256OfString(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/**
 * Compute the sha256 of raw bytes.
 */
export function sha256OfBytes(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

/**
 * Compute the sha256 of a file on disk.
 */
export async function sha256OfFile(path: string): Promise<string> {
  const file = Bun.file(path)
  const hasher = new Bun.CryptoHasher('sha256')
  const stream = file.stream()
  const reader = stream.getReader()
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) hasher.update(value)
    }
  } finally {
    reader.releaseLock()
  }
  return hasher.digest('hex')
}
