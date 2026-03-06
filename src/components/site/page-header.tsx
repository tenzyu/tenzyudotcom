import { cn } from '@/lib/utils'

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string
  description?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn('border-border/50 space-y-2 border-b pb-6', className)}
      {...props}
    >
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </div>
  )
}
