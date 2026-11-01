'use client'

import { useId, useState, useTransition } from 'react'
import { Button } from '@tenzyu/ui/button'
import { Textarea } from '@tenzyu/ui/textarea'
import { Label } from '@tenzyu/ui/label'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@tenzyu/ui/collapsible'
import { appendScrapEntryAction } from './scrap-admin-actions'
import type { AppendEntryFormDefaults } from './scrap-admin-form-defaults'

type ScrapAppendFormProps = {
  defaults: AppendEntryFormDefaults
  labels: {
    title: string
    kind: string
    locale: string
    body: string
    save: string
    cancel: string
    open: string
    close: string
    placeholder: string
  }
}

function nextEntryId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `e-${crypto.randomUUID().slice(0, 8)}`
  }
  return `e-${Date.now().toString(36)}`
}

export function ScrapAppendForm({ defaults, labels }: ScrapAppendFormProps) {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [kind, setKind] = useState<string>(defaults.kindOptions[0] ?? 'note')
  const [locale, setLocale] = useState<string>(defaults.locale)
  const [isPending, startTransition] = useTransition()
  const fieldId = useId()
  const entryId = nextEntryId()

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="border-border/60 bg-card/40 space-y-3 rounded-2xl border p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold tracking-tight">{labels.title}</p>
        <CollapsibleTrigger
          render={
            <Button type="button" variant="outline" size="sm">
              {open ? labels.close : labels.open}
            </Button>
          }
        />
      </div>

      <CollapsibleContent className="data-[state=closed]:hidden">
        <form
          action={(formData) =>
            startTransition(() => {
              appendScrapEntryAction(formData)
            })
          }
          className="space-y-3"
        >
          <input type="hidden" name="scrapSlug" value={defaults.scrapSlug} />
          <input type="hidden" name="uiLocale" value={defaults.uiLocale} />
          <input type="hidden" name="entryId" value={entryId} />

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-kind`}>{labels.kind}</Label>
              <select
                id={`${fieldId}-kind`}
                name="kind"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                {defaults.kindOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${fieldId}-locale`}>{labels.locale}</Label>
              <select
                id={`${fieldId}-locale`}
                name="locale"
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              >
                <option value="ja">ja</option>
                <option value="en">en</option>
              </select>
            </div>
          </div>

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
