const MAX_METADATA_BYTES = 1024 * 1024

/** Limit decoded response bytes, including when Content-Length is absent or compressed. */
export async function readBoundedMetadataHtml(
  response: Response,
  maxBytes = MAX_METADATA_BYTES,
): Promise<string> {
  if (!response.body) return ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const parts: string[] = []
  let bytes = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > maxBytes) {
        await reader.cancel()
        throw new Error('Metadata response exceeds byte limit')
      }
      parts.push(decoder.decode(value, { stream: true }))
    }
    parts.push(decoder.decode())
    return parts.join('')
  } finally {
    reader.releaseLock()
  }
}
