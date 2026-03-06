import { cn } from '@/lib/utils'

type SectionHeaderProps = {
  title: string
  description?: string
  /** 'divider' = h2 + flex h-px line, 'underline' = h2 + border-b */
  variant?: 'divider' | 'underline'
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

export function SectionHeader({
  title,
  description,
  variant = 'divider',
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {variant === 'divider' ? (
        <div className="flex items-center gap-4">
          <h2
            className={cn('text-2xl font-bold tracking-tight', titleClassName)}
          >
            {title}
          </h2>
          <div className="bg-border/50 h-px flex-1" />
        </div>
      ) : (
        <h2
          className={cn(
            'border-border text-foreground border-b pb-2 text-2xl font-bold tracking-tight',
            titleClassName,
          )}
        >
          {title}
        </h2>
      )}
      {description && (
        <p
          className={cn(
            'text-muted-foreground text-sm font-medium',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      )}
    </div>
  )
}
