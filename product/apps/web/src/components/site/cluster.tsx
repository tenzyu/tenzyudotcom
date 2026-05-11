import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@tenzyu/ui/cn'

const clusterVariants = cva('flex flex-wrap items-center', {
  variants: {
    gap: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      between: 'justify-between',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    gap: 'md',
    justify: 'start',
  },
})

function Cluster({
  className,
  gap,
  justify,
  ...props
}: React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof clusterVariants>) {
  return (
    <div
      className={cn(clusterVariants({ gap, justify }), className)}
      {...props}
    />
  )
}

export { Cluster, clusterVariants }
