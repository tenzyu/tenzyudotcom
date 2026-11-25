'use client'

import dynamic from 'next/dynamic'
import { MessageCircle } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button } from '@tenzyu/ui/button'
import { AdminGate } from '@/features/content-editor/ui/admin-gate'
import { AdminItemMenu } from '@/features/content-editor/ui/admin-item-menu'
import type { NoteEditorMode } from './note-item-dialog'

const NoteItemDialog = dynamic(() =>
  import('./note-item-dialog').then((module) => module.NoteItemDialog),
)

export function NoteControls(props: {
  locale: string
  id?: string
  focused?: boolean
}) {
  return (
    <AdminGate>
      <NoteActions {...props} />
    </AdminGate>
  )
}

function NoteActions({
  locale,
  id,
  focused,
}: {
  locale: string
  id?: string
  focused?: boolean
}) {
  const [mode, setMode] = useState<NoteEditorMode>()
  const menu = useRef<HTMLButtonElement>(null)
  const compose = useRef<HTMLButtonElement>(null)
  const ja = locale === 'ja'
  return (
    <>
      {id ? (
        <>
          <Button
            ref={compose}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={ja ? '返信' : 'Reply'}
            onClick={() => setMode('reply')}
          >
            <MessageCircle aria-hidden />
          </Button>
          <AdminItemMenu
            locale={locale}
            label={ja ? 'ノートの操作' : 'Note actions'}
            trigger={menu}
            onEdit={() => setMode('edit')}
            onDelete={() => setMode('delete')}
          />
        </>
      ) : (
        <Button ref={compose} type="button" onClick={() => setMode('create')}>
          {ja ? 'ノートを書く' : 'Write note'}
        </Button>
      )}
      {mode && (
        <NoteItemDialog
          id={id}
          locale={locale}
          mode={mode}
          focused={focused}
          trigger={mode === 'edit' || mode === 'delete' ? menu : compose}
          onClose={() => setMode(undefined)}
        />
      )}
    </>
  )
}
