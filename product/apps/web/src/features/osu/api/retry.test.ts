import { describe, expect, test } from 'bun:test'
import { retry } from './retry'

describe('retry backoff', () => {
  test('uses initialDelay before multiplying the delay', async () => {
    const originalSetTimeout = globalThis.setTimeout
    const delays: number[] = []
    let calls = 0

    try {
      globalThis.setTimeout = ((
        callback: () => void,
        delay?: number,
      ) => {
        delays.push(delay ?? 0)
        queueMicrotask(callback)
        return 0
      }) as unknown as typeof setTimeout

      const result = await retry(
        async () => {
          calls += 1
          if (calls < 3) throw new Error('transient')
          return 'recovered'
        },
        {
          maxAttempts: 3,
          initialDelay: 100,
          maxDelay: 150,
          backoffFactor: 2,
        },
      )

      expect(result).toBe('recovered')
      expect(calls).toBe(3)
      expect(delays).toEqual([100, 150])
    } finally {
      globalThis.setTimeout = originalSetTimeout
    }
  })

  test('does not retry a permanent failure', async () => {
    let calls = 0
    await expect(
      retry(
        async () => {
          calls += 1
          throw new Error('permanent')
        },
        { shouldRetry: () => false },
      ),
    ).rejects.toThrow('permanent')
    expect(calls).toBe(1)
  })
})
