'use client'

import { useSyncExternalStore } from 'react'
import { formatRelativeNoteTime } from './note-relative-time'

const CLOCK_INTERVAL_MS = 60_000
const listeners = new Set<() => void>()
let nowMs = Date.now()
let clockInterval: ReturnType<typeof setInterval> | undefined

function notifyTimeChange() {
  nowMs = Date.now()
  for (const listener of listeners) {
    listener()
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)

  if (listeners.size === 1) {
    notifyTimeChange()
    clockInterval = setInterval(notifyTimeChange, CLOCK_INTERVAL_MS)
  }

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && clockInterval !== undefined) {
      clearInterval(clockInterval)
      clockInterval = undefined
    }
  }
}

function getSnapshot() {
  return nowMs
}

function getServerSnapshot() {
  return 0
}

export function NoteRelativeTime({
  createdAt,
  locale,
}: {
  createdAt: string
  locale: string
}) {
  const currentTime = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )

  return (
    <time
      className="text-sm text-muted-foreground"
      dateTime={createdAt}
      suppressHydrationWarning
    >
      {formatRelativeNoteTime(
        createdAt,
        locale,
        currentTime || Date.now(),
      )}
    </time>
  )
}
