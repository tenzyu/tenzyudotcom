// NOTE: これは認証　かならずサーバーサイドで認可して。
'use client'

import { type ReactNode, useEffect, useState } from 'react'

type AuthState =
  | { ready: false; isAdmin: false }
  | { ready: true; isAdmin: boolean }

type AdminGateProps = {
  children: ReactNode
  fallback?: ReactNode
}

let cachedAuthState: AuthState | null = null
let authStatePromise: Promise<AuthState> | null = null

async function loadAdminAuthState(): Promise<AuthState> {
  if (cachedAuthState) {
    return cachedAuthState
  }

  if (!authStatePromise) {
    authStatePromise = fetch('/api/auth/me', {
      cache: 'no-store',
    })
      .then(async (res) => {
        const data = res.ok ? await res.json() : { isAdmin: false }

        return {
          ready: true,
          isAdmin: Boolean(data.isAdmin),
        } satisfies AuthState
      })
      .catch(
        () =>
          ({
            ready: true,
            isAdmin: false,
          }) satisfies AuthState,
      )
      .finally(() => {
        authStatePromise = null
      })
  }

  cachedAuthState = await authStatePromise
  return cachedAuthState
}

export function AdminGate({ children, fallback = null }: AdminGateProps) {
  const [auth, setAuth] = useState<AuthState>(
    cachedAuthState ?? {
      ready: false,
      isAdmin: false,
    },
  )

  useEffect(() => {
    let cancelled = false

    async function checkAdmin() {
      const nextAuth = await loadAdminAuthState()

      if (!cancelled) {
        setAuth(nextAuth)
      }
    }

    void checkAdmin()
    return () => {
      cancelled = true
    }
  }, [])

  // Initial state matches server HTML (null) to avoid hydration mismatch
  if (!auth.ready) return fallback

  if (!auth.isAdmin) return fallback

  return <>{children}</>
}
