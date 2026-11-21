'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import type {
  DocumentBase,
  ItemCommandResult,
} from '@/lib/content-store/json-item-command.domain'
import { invalidateAdminSession } from './admin-gate'

const Result = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saved'), version: z.string() }),
  z.object({
    kind: z.enum(['unchanged', 'conflict', 'unknown', 'unavailable', 'denied']),
  }),
  z.object({ kind: z.literal('invalid'), message: z.string() }),
])

type Failure = Exclude<ItemCommandResult, { kind: 'saved' }>
type Submission<T> = { base: DocumentBase; command: T }

export function useItemEditor<View extends { base: DocumentBase }, Command>({
  collection,
  id,
  locale,
  viewSchema,
  onSaved,
}: {
  collection: 'notes' | 'links'
  id?: string
  locale: string
  viewSchema: z.ZodType<View>
  onSaved: (command: Command, view: View) => void
}) {
  const url = `/api/editor/${collection}/item`
  const query = new URLSearchParams({ locale })
  if (id) query.set('id', id)
  const readUrl = `${url}?${query}`
  const [view, setView] = useState<View>()
  const [latest, setLatest] = useState<View>()
  const [pending, setPending] = useState(true)
  const [failure, setFailure] = useState<Failure>()
  const locked = useRef(false)
  const uncertain = useRef<Submission<Command> | null>(null)

  const read = useCallback(
    async (compare = false) => {
      if (locked.current) return
      locked.current = true
      setPending(true)
      try {
        const response = await fetch(readUrl, { cache: 'no-store' })
        if (response.status === 401) invalidateAdminSession()
        if (!response.ok) {
          const result = Result.safeParse(await response.json())
          setFailure(
            result.success && result.data.kind !== 'saved'
              ? result.data
              : { kind: 'unavailable' },
          )
          return
        }
        const parsed = viewSchema.parse(await response.json())
        if (compare) setLatest(parsed)
        else {
          setView(parsed)
          setFailure(undefined)
        }
      } catch {
        setFailure({ kind: 'unavailable' })
      } finally {
        locked.current = false
        setPending(false)
      }
    },
    [readUrl, viewSchema],
  )

  useEffect(() => {
    void read()
  }, [read])

  async function send(
    submission: Submission<Command>,
    operation: 'apply' | 'check',
  ) {
    if (locked.current || !view) return
    locked.current = true
    setPending(true)
    let result: ItemCommandResult
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, ...submission }),
        cache: 'no-store',
      })
      if (response.status === 401) invalidateAdminSession()
      result = Result.parse(await response.json())
    } catch {
      result = { kind: 'unknown' }
    } finally {
      locked.current = false
      setPending(false)
    }

    if (result.kind === 'saved') {
      uncertain.current = null
      setFailure(undefined)
      onSaved(submission.command, view)
      return
    }
    if (result.kind === 'unknown') uncertain.current = submission
    else if (operation === 'apply' || result.kind === 'unchanged')
      uncertain.current = null
    setFailure(result)
  }

  return {
    view,
    latest,
    pending,
    failure,
    needsCheck: uncertain.current !== null,
    read,
    useLatest() {
      if (!latest) return
      setView(latest)
      setLatest(undefined)
      setFailure(undefined)
      uncertain.current = null
    },
    submit(command: Command) {
      if (view && !uncertain.current && failure?.kind !== 'conflict') {
        void send({ base: view.base, command }, 'apply')
      }
    },
    check() {
      if (uncertain.current) void send(uncertain.current, 'check')
    },
  }
}
