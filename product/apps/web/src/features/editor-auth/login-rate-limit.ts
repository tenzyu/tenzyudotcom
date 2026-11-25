type RateLimitOptions = {
  windowMs: number
  maxAttempts: number
  maxClients: number
}

// Process-local defense in depth, not a distributed or trusted-proxy rate limiter.
export function createLoginRateLimiter({
  windowMs,
  maxAttempts,
  maxClients,
}: RateLimitOptions) {
  const clients = new Map<string, { count: number; resetAt: number }>()
  let sweepAt = 0

  function sweep(now: number) {
    for (const [key, entry] of clients) {
      if (entry.resetAt <= now) clients.delete(key)
    }
    sweepAt = now + windowMs
  }

  return {
    consume(key: string, now: number): boolean {
      if (now >= sweepAt) sweep(now)
      const current = clients.get(key)
      if (current && current.resetAt > now) {
        if (current.count >= maxAttempts) return false
        current.count += 1
        return true
      }
      // Do not evict live counters: churn would bypass the attempt limit.
      if (!current && clients.size >= maxClients) return false
      clients.set(key, { count: 1, resetAt: now + windowMs })
      return true
    },
    clear(key: string) {
      clients.delete(key)
    },
  }
}
