import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2.5 py-1 text-sm font-medium leading-[var(--tz-leading-solid)] whitespace-nowrap transition-[color,box-shadow,background,border-color] focus-visible:border-ring focus-visible:ring-[var(--tz-focus-ring-width)] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3.5',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary: 'border-border/70 bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        tertiary: 'border-info/35 bg-tertiary text-tertiary-foreground [a&]:hover:bg-tertiary/90',
        destructive: 'border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90',
        warning: 'border-warning/40 bg-warning/15 text-foreground',
        success: 'border-success/40 bg-success/15 text-foreground',
        outline: 'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        ghost: 'border-transparent text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        link: 'border-transparent text-link underline-offset-4 [a&]:hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

function Badge({
  className,
  variant = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span'

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
