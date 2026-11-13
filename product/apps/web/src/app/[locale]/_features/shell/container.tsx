import { Content } from '@/components/site/content'
import { cn } from '@tenzyu/ui'

type ContainerProps = {
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <Content size="xl" padded className={cn(className)} {...props}>
      {children}
    </Content>
  )
}
