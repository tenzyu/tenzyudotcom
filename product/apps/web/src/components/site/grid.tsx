import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@tenzyu/ui'

const gridVariants = cva('grid gap-[var(--tz-grid-gutter)]', {
  variants: {
    columns: {
      one: 'grid-cols-1',
      two: 'grid-cols-1 md:grid-cols-2',
      three: 'grid-cols-1 md:grid-cols-3',
      twelve: 'grid-cols-12',
      auto: 'grid-cols-[repeat(auto-fit,minmax(min(100%,18rem),1fr))]',
    },
  },
  defaultVariants: {
    columns: 'auto',
  },
})

function Grid({
  className,
  columns,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof gridVariants>) {
  return <div className={cn(gridVariants({ columns }), className)} {...props} />
}

export { Grid, gridVariants }
