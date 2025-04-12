import { cn } from '@/lib/utils'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={cn('py-12 sm:py-16 md:py-20', className)} {...props}>
      {children}
    </section>
  )
}
