import { describe, expect, test } from 'bun:test'
import { createLoginRateLimiter } from './login-rate-limit'

const create = () =>
  createLoginRateLimiter({ windowMs: 1000, maxAttempts: 2, maxClients: 2 })

describe('editor login rate limit', () => {
  test('rejects excess attempts until the original window expires', () => {
    const limit = create()
    expect(limit.consume('a', 0)).toBe(true)
    expect(limit.consume('a', 1)).toBe(true)
    expect(limit.consume('a', 2)).toBe(false)
    expect(limit.consume('a', 999)).toBe(false)
    expect(limit.consume('a', 1000)).toBe(true)
  })

  test('does not evict live counters when client capacity is exhausted', () => {
    const limit = create()
    expect(limit.consume('a', 0)).toBe(true)
    expect(limit.consume('a', 0)).toBe(true)
    expect(limit.consume('b', 1)).toBe(true)
    expect(limit.consume('c', 2)).toBe(false)
    expect(limit.consume('a', 2)).toBe(false)
    expect(limit.consume('c', 2000)).toBe(true)
  })

  test('reclaims capacity when a staggered client window expires', () => {
    const limit = create()
    expect(limit.consume('a', 0)).toBe(true)
    expect(limit.consume('b', 900)).toBe(true)
    expect(limit.consume('c', 1000)).toBe(true)
    expect(limit.consume('d', 1899)).toBe(false)
    expect(limit.consume('d', 1900)).toBe(true)
  })

  test('clears the authenticated client only', () => {
    const limit = create()
    for (const key of ['a', 'b']) {
      limit.consume(key, 0)
      limit.consume(key, 0)
    }
    limit.clear('a')
    expect(limit.consume('a', 1)).toBe(true)
    expect(limit.consume('b', 1)).toBe(false)
  })
})
