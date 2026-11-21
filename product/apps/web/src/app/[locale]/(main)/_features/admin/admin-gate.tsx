'use client'

import { Pencil, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react'
import { Button } from '@tenzyu/ui/button'

const AdminMode = createContext(false)
const SavedPage = createContext<(message: string, nextPath?: string) => void>(
  () => {},
)

export function invalidateAdminSession() {
  window.dispatchEvent(new Event('editor-session-invalid'))
}

export function useSavedPage() {
  return useContext(SavedPage)
}

function isEditablePage(pathname: string | null) {
  return /^\/(?:ja\/|en\/)?(blog|notes|links|scraps)(?:\/|$)/.test(
    pathname ?? '',
  )
}

export function PageAdmin({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const ja = !pathname?.startsWith('/en/')
  const [expiresAt, setExpiresAt] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [receipt, setReceipt] = useState<{
    message: string
    page: string | null
  }>()
  const [refreshing, startTransition] = useTransition()
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isEditablePage(pathname)) return
    const lifetime = new AbortController()
    let request: AbortController | undefined
    let expiry: number | undefined

    async function refresh() {
      request?.abort()
      const attempt = new AbortController()
      request = attempt
      try {
        const response = await fetch('/api/auth/me', {
          cache: 'no-store',
          signal: attempt.signal,
        })
        if (!response.ok) return
        const session: { expiresAt?: unknown } = await response.json()
        if (lifetime.signal.aborted || attempt.signal.aborted) return
        window.clearTimeout(expiry)
        const until =
          typeof session.expiresAt === 'number' &&
          session.expiresAt > Date.now()
            ? session.expiresAt
            : null
        setExpiresAt(until)
        if (until) {
          expiry = window.setTimeout(() => {
            invalidateAdminSession()
          }, until - Date.now())
        } else {
          setEditing(false)
          setReceipt(undefined)
        }
      } catch {
        // A temporary connection failure leaves the signed session's expiry in effect.
      }
    }

    function denied() {
      setExpiresAt(null)
      setEditing(false)
      setReceipt(undefined)
      void refresh()
    }

    function whenVisible() {
      if (document.visibilityState === 'visible') void refresh()
    }

    void refresh()
    window.addEventListener('focus', refresh)
    window.addEventListener('pageshow', refresh)
    window.addEventListener('editor-session-invalid', denied)
    document.addEventListener('visibilitychange', whenVisible)
    return () => {
      lifetime.abort()
      request?.abort()
      window.clearTimeout(expiry)
      window.removeEventListener('focus', refresh)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('editor-session-invalid', denied)
      document.removeEventListener('visibilitychange', whenVisible)
    }
  }, [pathname])

  const available = Boolean(
    isEditablePage(pathname) && expiresAt && expiresAt > Date.now(),
  )
  const active = available && editing

  function saved(message: string, nextPath?: string) {
    setReceipt({ message, page: nextPath ?? pathname })
    startTransition(() => {
      if (nextPath) router.replace(nextPath)
      else router.refresh()
    })
  }

  return (
    <AdminMode.Provider value={active}>
      <SavedPage.Provider value={saved}>
        {available && (
          <div className="flex flex-wrap items-center justify-end gap-2 sm:fixed sm:right-6 sm:bottom-6 sm:z-30">
            {active && receipt?.page === pathname && (
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-1 text-sm shadow-sm">
                <span role="status">{receipt.message}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={refreshing}
                  onClick={() => startTransition(() => router.refresh())}
                >
                  {ja ? '表示を更新' : 'Refresh page'}
                </Button>
              </div>
            )}
            <Button
              ref={toggle}
              type="button"
              aria-pressed={active}
              className="shadow-sm"
              variant={active ? 'secondary' : 'default'}
              onClick={() => {
                setEditing(!active)
                if (active) toggle.current?.focus()
              }}
            >
              {active ? <X aria-hidden /> : <Pencil aria-hidden />}
              {active
                ? ja
                  ? '編集を終了'
                  : 'Exit edit mode'
                : ja
                  ? 'このページを編集'
                  : 'Edit this page'}
            </Button>
          </div>
        )}
        {children}
      </SavedPage.Provider>
    </AdminMode.Provider>
  )
}

export function AdminGate({ children }: { children: ReactNode }) {
  return useContext(AdminMode) ? children : null
}
