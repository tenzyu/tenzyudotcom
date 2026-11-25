'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'
import { Button } from '@tenzyu/ui/button'
import { AdminGate } from '../../app/[locale]/(main)/_features/admin/admin-gate'
import { AdminItemMenu } from '../../app/[locale]/(main)/_features/admin/admin-item-menu'

const LinkItemDialog = dynamic(() =>
  import('./link-item-dialog').then((module) => module.LinkItemDialog),
)

export function LinkControls(props: { locale: string; shortCode?: string }) {
  return (
    <AdminGate>
      <LinkActions {...props} />
    </AdminGate>
  )
}

function LinkActions({
  locale,
  shortCode,
}: {
  locale: string
  shortCode?: string
}) {
  const [mode, setMode] = useState<'create' | 'edit' | 'delete'>()
  const trigger = useRef<HTMLButtonElement>(null)
  const ja = locale === 'ja'
  return (
    <>
      {shortCode ? (
        <AdminItemMenu
          label={ja ? `${shortCode} の操作` : `Link actions for ${shortCode}`}
          locale={locale}
          trigger={trigger}
          onEdit={() => setMode('edit')}
          onDelete={() => setMode('delete')}
        />
      ) : (
        <Button ref={trigger} type="button" onClick={() => setMode('create')}>
          {ja ? 'リンクを追加' : 'Add link'}
        </Button>
      )}
      {mode && (
        <LinkItemDialog
          mode={mode}
          locale={locale}
          shortCode={shortCode}
          trigger={trigger}
          onClose={() => setMode(undefined)}
        />
      )}
    </>
  )
}
