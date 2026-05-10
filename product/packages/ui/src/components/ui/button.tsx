import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '../../lib/cn'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius-md)] font-medium',
    'transition-[background,border-color,color,box-shadow,transform] duration-150',
    'outline-none focus-visible:border-ring focus-visible:ring-[var(--tz-focus-ring-width)] focus-visible:ring-ring/40',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  ],
  {
    variants: {
      variant: {
        default:
          'border border-primary/45 bg-primary text-primary-foreground shadow-[var(--shadow-accent)] hover:bg-primary/90 hover:border-primary/75 active:translate-y-px',
        primary:
          'border border-primary/45 bg-primary text-primary-foreground shadow-[var(--shadow-accent)] hover:bg-primary/90 hover:border-primary/75 active:translate-y-px',
        secondary:
          'border border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-border active:translate-y-px',
        tertiary:
          'border border-border/70 bg-tertiary text-tertiary-foreground hover:bg-tertiary/80 hover:border-info/40 active:translate-y-px',
        outline:
          'border border-border/80 bg-background/70 text-foreground shadow-sm hover:bg-muted/75 hover:border-primary/45 active:translate-y-px',
        soft:
          'border border-border/65 bg-card/75 text-foreground shadow-sm backdrop-blur-md hover:bg-card hover:border-primary/35 active:translate-y-px',
        ghost:
          'border border-transparent bg-transparent text-muted-foreground hover:bg-muted/70 hover:text-foreground active:translate-y-px',
        link:
          'h-auto min-h-0 rounded-[var(--radius-xs)] border-transparent bg-transparent p-0 text-link underline underline-offset-4 shadow-none hover:text-primary visited:text-link-visited',
        destructive:
          'border border-destructive/55 bg-destructive text-destructive-foreground hover:bg-destructive/90 active:translate-y-px',
      },
      size: {
        default: 'min-h-[var(--tz-min-target)] px-4 py-2 text-base has-[>svg]:px-3',
        sm: 'min-h-10 gap-1.5 rounded-[var(--radius-sm)] px-3 text-sm has-[>svg]:px-2.5',
        xs: 'min-h-[var(--tz-min-target-compact)] gap-1 rounded-[var(--radius-sm)] px-2 text-sm has-[>svg]:px-1.5 [&_svg:not([class*=\'size-\'])]:size-3.5',
        lg: 'min-h-12 rounded-[var(--radius-md)] px-6 text-base has-[>svg]:px-4',
        icon: 'size-[var(--tz-min-target)]',
        'icon-sm': 'size-10',
        'icon-xs': 'size-[var(--tz-min-target-compact)] rounded-[var(--radius-sm)] [&_svg:not([class*=\'size-\'])]:size-3.5',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

