'use client'

import { Ellipsis, Pencil, Trash2 } from 'lucide-react'
import type { Ref } from 'react'
import { Button } from '@tenzyu/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tenzyu/ui/dropdown-menu'

export function AdminItemMenu({
  label,
  locale,
  trigger,
  onEdit,
  onDelete,
}: {
  label: string
  locale: string
  trigger: Ref<HTMLButtonElement>
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            ref={trigger}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
          >
            <Ellipsis aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil aria-hidden />
          {locale === 'ja' ? '編集' : 'Edit'}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onDelete}>
          <Trash2 aria-hidden />
          {locale === 'ja' ? '削除' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
