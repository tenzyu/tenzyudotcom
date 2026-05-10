import { Content } from '@tenzyu/ui'
import { cn } from '@/lib/utils/common'

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
