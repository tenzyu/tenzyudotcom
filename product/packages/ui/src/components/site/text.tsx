import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const textVariants = cva('', {
  variants: {
    variant: {
      body: 'text-base leading-[var(--tz-leading-readable)] text-foreground',
      lead: 'text-lg leading-[var(--tz-leading-readable)] text-muted-foreground',
      prose: 'text-base leading-[var(--tz-leading-comfort)] text-foreground',
      muted: 'text-base leading-[var(--tz-leading-readable)] text-muted-foreground',
      meta: 'text-sm leading-[var(--tz-leading-compact)] text-muted-foreground',
      dense: 'text-sm leading-[var(--tz-leading-compact)] text-foreground',
      code: 'font-mono text-sm leading-[var(--tz-leading-compact)]',
    },
  },
  defaultVariants: {
    variant: 'body',
  },
})

function Text({
  className,
  variant = 'body',
  as: Comp = 'p',
  ...props
}: React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    as?: 'p' | 'span' | 'div' | 'small'
  }) {
  return <Comp className={cn(textVariants({ variant }), className)} {...props} />
}

export { Text, textVariants }
