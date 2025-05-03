import { cn } from '@/lib/utils'

type SectionProps = {
  children: React.ReactNode
  id?: string
} & React.HTMLAttributes<HTMLElement>

export function Section({ children, className, id, ...props }: SectionProps) {
  return (
    <section
      id={id}
      className={cn('py-6 sm:py-8 md:py-8', className)}
      {...props}
    >
      {children}
    </section>
  )
}
