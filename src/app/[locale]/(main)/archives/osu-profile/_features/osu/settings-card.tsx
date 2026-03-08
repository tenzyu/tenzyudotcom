import { useIntlayer } from 'next-intlayer/server'
import type { ReactNode } from 'react'

import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils/common'

type SettingsCardProps = {
  title: string
  children: ReactNode
  className?: string
}

export function SettingsCard({
  title,
  children,
  className,
}: SettingsCardProps) {
  const settings = useIntlayer('settings')

  return (
    <Card className={cn('h-full', className)} role="region" aria-label={title}>
      <CardContent className="px-6 py-4">
        <CardTitle className="pb-4 text-lg" role="heading" aria-level={2}>
          {title}
        </CardTitle>
        <fieldset
          className="flex flex-col gap-6 md:flex-row"
          aria-label={`${title} ${settings.aria.settingsContent.value}`}
        >
          {children}
        </fieldset>
      </CardContent>
    </Card>
  )
}

type SettingsVisualizationProps = {
  children: ReactNode
  className?: string
}

export function SettingsVisualization({
  children,
  className,
}: SettingsVisualizationProps) {
  const settings = useIntlayer('settings')

  return (
    <div
      className={cn('md:w-1/2', className)}
      role="img"
      aria-label={settings.aria.settingsVisualization.value}
    >
      {children}
    </div>
  )
}

type SettingsDataProps = {
  children: ReactNode
  className?: string
}

export function SettingsData({ children, className }: SettingsDataProps) {
  const settings = useIntlayer('settings')

  return (
    <aside
      className={cn('md:w-1/2', className)}
      aria-label={settings.aria.settingsDetails.value}
    >
      <div className="space-y-4">{children}</div>
    </aside>
  )
}

type SettingsDataItemProps = {
  label: string
  children: ReactNode
}

export function SettingsDataItem({ label, children }: SettingsDataItemProps) {
  return (
    <fieldset aria-labelledby={`settings-label-${label}`}>
      <div
        id={`settings-label-${label.toLowerCase()}`}
        className="text-foreground mb-1 font-medium"
      >
        {label}:
      </div>
      {children}
    </fieldset>
  )
}

type SettingsGridProps = {
  children: ReactNode
  columns?: 2 | 3
  className?: string
}

// TODO: columns いろいろ対応
export function SettingsGrid({
  children,
  columns = 2,
  className,
}: SettingsGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-2',
        columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
        className,
      )}
    >
      {children}
    </ul>
  )
}

type SettingsGridItemProps = {
  label: string
  value: string | number
}

export function SettingsGridItem({ label, value }: SettingsGridItemProps) {
  return (
    <li>
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground ml-2 font-medium">{value}</span>
    </li>
  )
}
