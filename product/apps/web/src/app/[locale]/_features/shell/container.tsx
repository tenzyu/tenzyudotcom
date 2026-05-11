import { Content } from '@tenzyu/ui/content'
import { cn } from '@tenzyu/ui/cn'

type ContainerProps = {
  children: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <Content
      size="xl"
      padded
      className={cn(className)}
      {...props}
    >
      {children}
    </Content>
  )
}
