import type { CSSProperties, ReactNode } from 'react'

import { cn } from '../lib/utils'

export function StoryPage({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('w-full max-w-4xl space-y-6', className)}>
      {children}
    </div>
  )
}

export function StorySection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function StoryGrid({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {children}
    </div>
  )
}

export function StorySurface({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-4 text-card-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}

export function TokenSwatch({
  name,
  token,
  className,
  style,
}: {
  name: string
  token: string
  className: string
  style?: CSSProperties
}) {
  return (
    <div className="overflow-hidden rounded-lg border bg-card text-card-foreground">
      <div className={cn('h-16', className)} style={style} />
      <div className="space-y-1 p-3">
        <div className="text-sm font-medium">{name}</div>
        <div className="font-mono text-xs text-muted-foreground">--{token}</div>
      </div>
    </div>
  )
}
