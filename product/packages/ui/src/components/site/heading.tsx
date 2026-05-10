import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/cn'

const headingVariants = cva('text-balance font-bold tracking-tight text-foreground', {
  variants: {
    size: {
      display: 'text-5xl leading-[var(--tz-leading-heading)] md:text-6xl',
      h1: 'text-4xl leading-[var(--tz-leading-heading)] md:text-5xl',
      h2: 'text-3xl leading-[var(--tz-leading-heading)]',
      h3: 'text-2xl leading-[var(--tz-leading-heading)]',
      h4: 'text-xl leading-[var(--tz-leading-heading)]',
      h5: 'text-lg leading-[var(--tz-leading-heading)]',
    },
  },
  defaultVariants: {
    size: 'h2',
  },
})

function Heading({
  className,
  size = 'h2',
  as,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5'
  }) {
  const Comp = as ?? (size === 'display' ? 'h1' : size)
  return <Comp className={cn(headingVariants({ size }), className)} {...props} />
}

export { Heading, headingVariants }
