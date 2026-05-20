'use client'

import { Ellipsis, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@tenzyu/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tenzyu/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tenzyu/ui/dropdown-menu'

type AdminItemMenuProps = {
  icon?: 'horizontal' | 'vertical'
  label: string
  onEdit: () => void
  onDelete: () => Promise<void> | void
}

export function AdminItemMenu({
  icon = 'vertical',
  label,
  onEdit,
  onDelete,
}: AdminItemMenuProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              aria-label={`${label} actions`}
            >
              {icon === 'horizontal' ? (
                <Ellipsis className="size-4" />
              ) : (
                <MoreVertical className="size-4" />
              )}
            </Button>
          }
        ></DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault()
              onEdit()
            }}
          >
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onSelect={(event) => {
              event.preventDefault()
              setConfirmOpen(true)
            }}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="default"
            disabled={isDeleting}
            onClick={async (event) => {
              event.preventDefault()
              setIsDeleting(true)
              try {
                await onDelete()
                setConfirmOpen(false)
              } finally {
                setIsDeleting(false)
              }
            }}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
