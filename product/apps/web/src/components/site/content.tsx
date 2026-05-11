import { cn } from '@tenzyu/ui/cn'

type ContentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

const sizeClasses: Record<ContentSize, string> = {
  xs: 'max-w-[var(--tz-container-xs)]',
  sm: 'max-w-[var(--tz-container-sm)]',
  md: 'max-w-[var(--tz-container-md)]',
  lg: 'max-w-[var(--tz-container-lg)]',
  xl: 'max-w-[var(--tz-container-xl)]',
  '2xl': 'max-w-[var(--tz-container-2xl)]',
  full: 'max-w-none',
}

function Content({
  size = 'md',
  padded = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  size?: ContentSize
  padded?: boolean
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        padded && 'px-[var(--tz-page-padding-x)]',
        className,
      )}
      {...props}
    />
  )
}

export { Content, type ContentSize }
