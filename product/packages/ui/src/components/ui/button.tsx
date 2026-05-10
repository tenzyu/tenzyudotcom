import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '../../lib/cn'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'rounded-[var(--radius-md)] text-sm font-medium',
    'transition-[background,border-color,color,box-shadow,transform] duration-200',
    'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=\'size-\'])]:size-4',
  ],
  {
    variants: {
      variant: {
        default:
          'border border-primary/40 bg-primary text-primary-foreground shadow-[var(--shadow-accent)] hover:bg-primary/90 hover:border-primary/70',
        primary:
          'border border-primary/40 bg-primary text-primary-foreground shadow-[var(--shadow-accent)] hover:bg-primary/90 hover:border-primary/70',
        secondary:
          'border border-border/70 bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:border-border',
        outline:
          'border border-border/70 bg-background/70 text-foreground shadow-sm hover:bg-muted/70 hover:border-primary/40',
        soft:
          'border border-border/60 bg-card/70 text-foreground shadow-sm backdrop-blur-md hover:bg-card hover:border-primary/30',
        ghost:
          'border border-transparent bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        destructive:
          'border border-destructive/50 bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        xs: 'h-6 gap-1 rounded-[var(--radius-sm)] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*=\'size-\'])]:size-3',
        sm: 'h-8 gap-1.5 rounded-[var(--radius-sm)] px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-[var(--radius-md)] px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': 'size-6 rounded-[var(--radius-sm)] [&_svg:not([class*=\'size-\'])]:size-3',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
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
