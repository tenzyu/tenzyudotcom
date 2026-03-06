import { retry } from '@/lib/utils/retry'

import type { APIError } from '@/lib/error/types'

export class OsuAPIError extends Error implements APIError {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = 'OSU_API_ERROR',
  ) {
    super(message)
    this.name = 'OsuApiError'
  }
}

export const handleOsuAPIError = (error: unknown): never => {
  console.error('osu! API Error:', error)
  if (error instanceof OsuAPIError) {
    throw error
  }
  throw new OsuAPIError('An error occurred while fetching data from osu! API')
}

// リトライ設定
export const API_RETRY_OPTIONS = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffFactor: 2,
  shouldRetry: (error: unknown) => {
    if (error instanceof OsuAPIError) {
      // 429 (Rate Limit)の場合はリトライ
      // 500番台のサーバーエラーの場合もリトライ
      return (
        error.statusCode === 429 ||
        (error.statusCode >= 500 && error.statusCode < 600)
      )
    }
    return false
  },
} as const

/**
 * APIコールをリトライロジック付きで実行する
 */
export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  return retry(fn, API_RETRY_OPTIONS)
}
