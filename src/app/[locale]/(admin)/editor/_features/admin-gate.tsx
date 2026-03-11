'use client'

import { useEffect, useState, type ReactNode } from 'react'

type AuthState =
  | { ready: false; isAdmin: false }
  | { ready: true; isAdmin: boolean }

type AdminGateProps = {
  children: ReactNode
  fallback?: ReactNode
}

export function AdminGate({ children, fallback = null }: AdminGateProps) {
  const [auth, setAuth] = useState<AuthState>({
    ready: false,
    isAdmin: false,
  })

  useEffect(() => {
    let cancelled = false

    async function checkAdmin() {
      try {
        const res = await fetch('/api/auth/me', {
          cache: 'no-store',
        })

        const data = res.ok ? await res.json() : { isAdmin: false }

        if (!cancelled) {
          setAuth({
            ready: true,
            isAdmin: Boolean(data.isAdmin),
          })
        }
      } catch {
        if (!cancelled) {
          setAuth({
            ready: true,
            isAdmin: false,
          })
        }
      }
    }

    checkAdmin()
    return () => {
      cancelled = true
    }
  }, [])

  // Initial state matches server HTML (null) to avoid hydration mismatch
  if (!auth.ready) return fallback as any

  if (!auth.isAdmin) return fallback as any

  return <>{children}</>
}
