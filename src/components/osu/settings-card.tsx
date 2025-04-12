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
    <Card className={cn('h-full', className)}>
      <CardContent className="px-6 py-4">
        <CardTitle className="pb-4 text-lg">{title}</CardTitle>
        <div className="flex flex-col gap-6 md:flex-row">{children}</div>
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
  return <div className={cn('md:w-1/2', className)}>{children}</div>
}

type SettingsDataProps = {
  children: ReactNode
  className?: string
}

export function SettingsData({ children, className }: SettingsDataProps) {
  return (
    <div className={cn('md:w-1/2', className)}>
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
    <div>
      <div className="mb-1 font-medium">{label}:</div>
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
    <div>
      <span>{label}:</span>
      <span className="ml-2 font-medium">{value}</span>
    </div>
  )
}
