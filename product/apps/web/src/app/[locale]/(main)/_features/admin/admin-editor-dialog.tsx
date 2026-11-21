'use client'

import { type ReactNode, type RefObject, useRef } from 'react'
import { Button } from '@tenzyu/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@tenzyu/ui/dialog'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@tenzyu/ui/alert-dialog'
import type { ItemCommandResult } from '@/lib/content-store/json-item-command.validation'

export function AdminEditorDialog({
  title,
  description,
  trigger,
  pending,
  destructive = false,
  className = '',
  onClose,
  children,
}: {
  title: string
  description?: string
  trigger: RefObject<HTMLButtonElement | null>
  pending: boolean
  destructive?: boolean
  className?: string
  onClose: () => void
  children: ReactNode
}) {
  const heading = useRef<HTMLHeadingElement>(null)
  const change = (open: boolean) => {
    if (!open && !pending) onClose()
  }
  if (destructive) {
    return (
      <AlertDialog open onOpenChange={change}>
        <AlertDialogContent initialFocus={heading} finalFocus={trigger}>
          <AlertDialogHeader>
            <AlertDialogTitle ref={heading} tabIndex={-1}>
              {title}
            </AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          {children}
        </AlertDialogContent>
      </AlertDialog>
    )
  }
  return (
    <Dialog open onOpenChange={change}>
      <DialogContent
        initialFocus={heading}
        finalFocus={trigger}
        showCloseButton={false}
        className={`max-h-[calc(100dvh-1rem)] overflow-y-auto sm:max-w-lg ${className}`}
      >
        <DialogHeader>
          <DialogTitle ref={heading} tabIndex={-1}>
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

export function ItemEditorFeedback({
  locale,
  pending,
  failure,
  needsCheck,
  hasView,
  retryRead,
  check,
  latest,
}: {
  locale: string
  pending: boolean
  failure?: Exclude<ItemCommandResult, { kind: 'saved' }>
  needsCheck: boolean
  hasView: boolean
  retryRead: () => void
  check: () => void
  latest?: ReactNode
}) {
  const ja = locale === 'ja'
  const message =
    failure &&
    {
      invalid: failure.kind === 'invalid' ? failure.message : '',
      conflict: ja
        ? '別の画面で変更されました。下書きと最新の値を確認してください。'
        : 'This item changed. Compare your draft with the latest values.',
      unknown: ja
        ? '保存結果が不明です。Git の状態を確認してください。'
        : 'The save outcome is unknown. Check Git before retrying.',
      unchanged: ja
        ? 'Git は変更されていません。同じ下書きの保存を再試行できます。'
        : 'Git still matches your starting version. You can retry this draft.',
      unavailable: ja
        ? 'ストレージに接続できません。もう一度お試しください。'
        : 'Storage is unavailable. Try again.',
      denied: ja
        ? 'セッションを確認してください。'
        : 'Check your editor session.',
    }[failure.kind]

  return (
    <>
      {pending && <p role="status">{ja ? '処理中…' : 'Working…'}</p>}
      {message && (
        <p role="alert" className="text-destructive">
          {message}
        </p>
      )}
      {needsCheck && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={check}
        >
          {ja ? '保存結果を確認' : 'Check saved change'}
        </Button>
      )}
      {((!hasView && failure) || failure?.kind === 'conflict') && (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={retryRead}
        >
          {hasView
            ? ja
              ? '最新の値を比較'
              : 'Compare latest'
            : ja
              ? '再読み込み'
              : 'Retry read'}
        </Button>
      )}
      {latest}
    </>
  )
}
