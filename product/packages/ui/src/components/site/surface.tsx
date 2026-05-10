import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { cn } from '../../lib/cn'

const surfaceVariants = cva('border text-card-foreground', {
  variants: {
    variant: {
      default: 'rounded-[var(--radius-xl)] border-border/70 bg-card shadow-[var(--shadow-surface)]',
      soft: 'rounded-[var(--radius-xl)] border-border/60 bg-card/70 shadow-[var(--shadow-surface)] backdrop-blur-xl',
      quiet: 'rounded-[var(--radius-lg)] border-border/50 bg-muted/25',
      flat: 'rounded-[var(--radius-lg)] border-border/70 bg-background',
      info: 'rounded-[var(--radius-lg)] border-info/40 bg-info/10 text-foreground',
      warning: 'rounded-[var(--radius-lg)] border-warning/45 bg-warning/12 text-foreground',
      danger: 'rounded-[var(--radius-lg)] border-destructive/45 bg-destructive/10 text-foreground',
      success: 'rounded-[var(--radius-lg)] border-success/45 bg-success/10 text-foreground',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      page: 'p-[var(--tz-card-padding)]',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'page',
  },
})

function Surface({
  className,
  variant,
  padding,
  asChild = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof surfaceVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'div'
  return <Comp className={cn(surfaceVariants({ variant, padding }), className)} {...props} />
}

export { Surface, surfaceVariants }
