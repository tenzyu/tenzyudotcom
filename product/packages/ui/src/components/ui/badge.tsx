import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '../../lib/cn'

const badgeVariants = cva(
  'inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-[color,box-shadow,background,border-color] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&>svg]:pointer-events-none [&>svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-primary/30 bg-primary/12 text-primary [a&]:hover:bg-primary/20',
        secondary: 'border-border/60 bg-secondary/70 text-secondary-foreground [a&]:hover:bg-secondary',
        destructive: 'border-destructive/30 bg-destructive/15 text-destructive [a&]:hover:bg-destructive/20',
        outline: 'border-border/70 bg-background/50 text-foreground [a&]:hover:bg-muted',
        ghost: 'border-transparent text-muted-foreground [a&]:hover:bg-muted [a&]:hover:text-foreground',
        link: 'border-transparent text-primary underline-offset-4 [a&]:hover:underline',
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
