import { cn } from '../../lib/cn'

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}

function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-2xl)] border border-border/60 bg-card/55 px-5 py-6 shadow-[var(--shadow-surface)] backdrop-blur-xl sm:px-6',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary/50 before:to-transparent',
        className,
      )}
      {...props}
    >
      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-2">
          {eyebrow ? (
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold tracking-[-0.04em] text-balance sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="text-muted-foreground max-w-2xl text-sm leading-7">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}

export { PageHeader }
export type { PageHeaderProps }
