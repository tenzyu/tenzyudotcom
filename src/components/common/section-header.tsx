import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  title: string
  description?: string
  /** 'divider' = h2 + flex h-px line, 'underline' = h2 + border-b */
  variant?: 'divider' | 'underline'
  className?: string
}

export function SectionHeader({
  title,
  description,
  variant = 'divider',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {variant === 'divider' ? (
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <div className="bg-border/50 h-px flex-1" />
        </div>
      ) : (
        <h2 className="border-border text-foreground border-b pb-2 text-2xl font-bold tracking-tight">
          {title}
        </h2>
      )}
      {description && (
        <p className="text-muted-foreground text-sm font-medium">
          {description}
        </p>
      )}
    </div>
  )
}
