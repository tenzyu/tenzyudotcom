import { cn } from '@/lib/utils'

type ContentSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | '7xl'
  | 'full'

const sizeClasses: Record<ContentSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-none',
}

type ContentProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: ContentSize
}

export function Content({ size = '4xl', className, ...props }: ContentProps) {
  return (
    <div
      className={cn('mx-auto w-full', sizeClasses[size], className)}
      {...props}
    />
  )
}
