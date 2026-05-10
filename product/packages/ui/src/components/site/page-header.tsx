import { cn } from '../../lib/cn'
import { Heading } from './heading'
import { Text } from './text'

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: React.ReactNode
  description?: React.ReactNode
  eyebrow?: React.ReactNode
  actions?: React.ReactNode
}

function PageHeader({ title, description, eyebrow, actions, className, ...props }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'grid gap-5 border-b border-border/70 pb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end',
        className,
      )}
      {...props}
    >
      <div className="min-w-0 space-y-3">
        {eyebrow ? (
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
        ) : null}
        <Heading as="h1" size="h1">{title}</Heading>
        {description ? <Text variant="lead" className="max-w-3xl">{description}</Text> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 md:justify-end">{actions}</div> : null}
    </header>
  )
}

export { PageHeader }
