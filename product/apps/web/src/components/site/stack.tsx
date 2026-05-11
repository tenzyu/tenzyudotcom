import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@tenzyu/ui/cn'

const stackVariants = cva('flex flex-col', {
  variants: {
    gap: {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
      section: 'gap-[var(--tz-gap-section)]',
    },
  },
  defaultVariants: {
    gap: 'md',
  },
})

function Stack({
  className,
  gap,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof stackVariants>) {
  return <div className={cn(stackVariants({ gap }), className)} {...props} />
}

export { Stack, stackVariants }
