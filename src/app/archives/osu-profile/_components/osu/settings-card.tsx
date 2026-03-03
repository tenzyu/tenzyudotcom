import { ReactNode } from 'react'

import { Card, CardContent, CardTitle } from '@/components/shadcn-ui/card'
import { cn } from '@/lib/utils'

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
  return (
    <Card className={cn('h-full', className)} role="region" aria-label={title}>
      <CardContent className="px-6 py-4">
        <CardTitle className="pb-4 text-lg" role="heading" aria-level={2}>
          {title}
        </CardTitle>
        <div
          className="flex flex-col gap-6 md:flex-row"
          role="group"
          aria-label={`${title} settings content`}
        >
          {children}
        </div>
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
  return (
    <div
      className={cn('md:w-1/2', className)}
      role="img"
      aria-label="Settings visualization"
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
  return (
    <div
      className={cn('md:w-1/2', className)}
      role="complementary"
      aria-label="Settings details"
    >
      <div className="space-y-4">{children}</div>
    </div>
  )
}

type SettingsDataItemProps = {
  label: string
  children: ReactNode
}

export function SettingsDataItem({ label, children }: SettingsDataItemProps) {
  return (
    <div role="group" aria-labelledby={`settings-label-${label.toLowerCase()}`}>
      <div
        id={`settings-label-${label.toLowerCase()}`}
        className="text-foreground mb-1 font-medium"
      >
        {label}:
      </div>
      {children}
    </div>
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
    <div
      className={cn(
        'grid gap-2',
        columns === 2 ? 'grid-cols-2' : 'grid-cols-3',
        className,
      )}
      role="list"
    >
      {children}
    </div>
  )
}

type SettingsGridItemProps = {
  label: string
  value: string | number
}

export function SettingsGridItem({ label, value }: SettingsGridItemProps) {
  return (
    <div role="listitem">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-foreground ml-2 font-medium">{value}</span>
    </div>
  )
}
