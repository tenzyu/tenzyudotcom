import { cn } from '@/lib/utils'

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
}

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={cn('py-6 sm:py-8 md:py-8', className)} {...props}>
      {children}
    </section>
  )
}
