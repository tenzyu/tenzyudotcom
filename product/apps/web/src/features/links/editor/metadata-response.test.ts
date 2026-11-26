import { describe, expect, test } from 'bun:test'

import { readBoundedMetadataHtml } from './metadata-response'

describe('metadata response limits', () => {
  test('decodes UTF-8 across chunk boundaries and accepts the exact limit', async () => {
    const bytes = new TextEncoder().encode('日本語')
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(bytes.slice(0, 2))
        controller.enqueue(bytes.slice(2))
        controller.close()
      },
    }))
    expect(await readBoundedMetadataHtml(response, bytes.length)).toBe('日本語')
  })

  test('cancels an oversized streaming response without trusting headers', async () => {
    let cancelled = false
    const response = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(3))
        controller.enqueue(new Uint8Array(3))
      },
      cancel() {
        cancelled = true
      },
    }), { headers: { 'Content-Length': '1' } })
    await expect(readBoundedMetadataHtml(response, 5)).rejects.toThrow('byte limit')
    expect(cancelled).toBe(true)
  })

  test('handles an empty response', async () => {
    expect(await readBoundedMetadataHtml(new Response(null))).toBe('')
  })
})
