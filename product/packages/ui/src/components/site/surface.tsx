import { cn } from '../../lib/cn'

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: 'default' | 'muted' | 'accent'
}

function Surface({ tone = 'default', className, ...props }: SurfaceProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] border shadow-[var(--shadow-surface)] backdrop-blur-xl',
        tone === 'default' && 'border-border/60 bg-card/65',
        tone === 'muted' && 'border-border/50 bg-muted/30',
        tone === 'accent' && 'border-primary/30 bg-primary/10',
        className,
      )}
      {...props}
    />
  )
}

export { Surface }
export type { SurfaceProps }
