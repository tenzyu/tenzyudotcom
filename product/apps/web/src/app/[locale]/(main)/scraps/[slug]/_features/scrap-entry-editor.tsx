'use client'

import { useId, useState, useTransition } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@tenzyu/ui/button'
import { Textarea } from '@tenzyu/ui/textarea'
import { Label } from '@tenzyu/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@tenzyu/ui/collapsible'
import { editScrapEntryAction } from './scrap-admin-actions'

type ScrapEntryEditorProps = {
  scrapSlug: string
  entryId: string
  locale: 'ja' | 'en'
  uiLocale: string
  initialBody: string
  labels: {
    title: string
    body: string
    save: string
    cancel: string
    open: string
    close: string
    placeholder: string
  }
}

export function ScrapEntryEditor({
  scrapSlug,
  entryId,
  locale,
  uiLocale,
  initialBody,
  labels,
}: ScrapEntryEditorProps) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState(initialBody)
  const [isPending, startTransition] = useTransition()
  const fieldId = useId()

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-border/60 bg-card/30 space-y-3 rounded-2xl border border-dashed p-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          {labels.title}
        </p>
        <CollapsibleTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
            >
              <Pencil className="mr-1 size-3.5" />
              {open ? labels.close : labels.open}
            </Button>
          }
        />
      </div>

      <CollapsibleContent className="data-[state=closed]:hidden">
        <form
          action={(formData) =>
            startTransition(() => {
              editScrapEntryAction(formData)
            })
          }
          className="space-y-3"
        >
          <input type="hidden" name="scrapSlug" value={scrapSlug} />
          <input type="hidden" name="entryId" value={entryId} />
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="uiLocale" value={uiLocale} />

          <div className="space-y-1">
            <Label htmlFor={`${fieldId}-body`}>{labels.body}</Label>
            <Textarea
              id={`${fieldId}-body`}
              name="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-40 font-mono text-xs"
              placeholder={labels.placeholder}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              {labels.cancel}
            </Button>
            <Button type="submit" disabled={isPending || body.trim() === ''}>
              {labels.save}
            </Button>
          </div>
        </form>
      </CollapsibleContent>
    </Collapsible>
  )
}
