'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import {
  createContext,
  type ReactNode,
  startTransition,
  useContext,
  useRef,
  useState,
} from 'react'
import { Button } from '@tenzyu/ui/button'
import { buildLocalizedUrl } from '@/lib/intlayer/localized-url'
import type { ScrapWorkspaceMode } from '@/app/[locale]/_features/scrap-editor/scrap-workspace'
import type { ScrapWorkspaceView } from '@/app/[locale]/_features/scrap-editor/scrap-workspace.validation'
import { isPublicScrap } from '@/features/scraps/scraps.domain'
import { AdminGate, useSavedPage } from '@/features/content-editor/ui/admin-gate'

const ScrapDetailDialog = dynamic(() =>
  import('./scrap-editor-dialog').then((module) => module.ScrapDetailDialog),
)
const PrivateScrapList = dynamic(() =>
  import('./scrap-editor-dialog').then((module) => module.PrivateScrapList),
)

const DetailEditor = createContext<
  (mode: ScrapWorkspaceMode, trigger: HTMLButtonElement) => void
>(() => {})

export function ScrapEditButton({
  mode,
  children,
}: {
  mode: ScrapWorkspaceMode
  children: ReactNode
}) {
  const open = useContext(DetailEditor)
  return (
    <AdminGate>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(event) => open(mode, event.currentTarget)}
      >
        {children}
      </Button>
    </AdminGate>
  )
}

export function ScrapDetailEditor({
  slug,
  locale,
  children,
}: {
  slug: string
  locale: string
  children: ReactNode
}) {
  const router = useRouter()
  const saved = useSavedPage()
  const [mode, setMode] = useState<ScrapWorkspaceMode>()
  const trigger = useRef<HTMLButtonElement>(null)
  const ja = locale === 'ja'

  function changed(view: ScrapWorkspaceView) {
    if (!isPublicScrap(view.manifest)) {
      saved(
        ja ? 'Git に保存しました' : 'Saved to Git',
        buildLocalizedUrl(`/scraps?draft=${encodeURIComponent(slug)}`, locale),
      )
      return
    }
    startTransition(() => router.refresh())
  }

  return (
    <DetailEditor.Provider
      value={(next, button) => {
        trigger.current = button
        setMode(next)
      }}
    >
      {children}
      <AdminGate>
        {mode && (
          <ScrapDetailDialog
            locale={locale}
            slug={slug}
            mode={mode}
            trigger={trigger}
            onClose={() => setMode(undefined)}
            onCommitted={changed}
          />
        )}
      </AdminGate>
    </DetailEditor.Provider>
  )
}

export function ScrapListEditor({ locale }: { locale: string }) {
  return (
    <AdminGate>
      <PrivateScrapList locale={locale} />
    </AdminGate>
  )
}
