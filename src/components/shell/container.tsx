import { Content } from '@/components/site-ui/content'
import { cn } from '@/lib/utils'

type ContainerProps = {
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <Content
      size="7xl"
      className={cn('px-5 sm:px-8 lg:px-12', className)}
      {...props}
    >
      {children}
    </Content>
  )
}
