import { cn } from '../../lib/cn'

type SectionHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  variant?: 'divider' | 'underline' | 'plain'
  className?: string
  titleClassName?: string
  descriptionClassName?: string
  icon?: React.ReactNode
}

function SectionHeader({
  title,
  description,
  variant = 'divider',
  className,
  titleClassName,
  descriptionClassName,
  icon,
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-4">
        {icon ? (
          <div className="border-primary/20 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-4">
            <h2 className={cn('text-2xl font-bold tracking-[-0.035em]', titleClassName)}>
              {title}
            </h2>
            {variant === 'divider' ? (
              <div className="h-px flex-1 bg-linear-to-r from-border via-border/60 to-transparent" />
            ) : null}
          </div>
          {description ? (
            <p className={cn('text-muted-foreground mt-1 text-sm leading-6', descriptionClassName)}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {variant === 'underline' ? <div className="h-px bg-border/70" /> : null}
    </div>
  )
}

export { SectionHeader }
export type { SectionHeaderProps }
