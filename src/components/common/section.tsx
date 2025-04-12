import { cn } from '@/lib/utils'

type SectionProps = {
  children: React.ReactNode
} & React.HTMLAttributes<HTMLElement>

export function Section({ children, className, ...props }: SectionProps) {
  return (
    <section className={cn('py-6 sm:py-8 md:py-8', className)} {...props}>
      {children}
    </section>
  )
}
