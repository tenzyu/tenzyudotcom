import { cn } from '@/lib/utils'

type ContainerProps = {
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
