import { cn } from '../../lib/cn'
import { Heading } from './heading'
import { Text } from './text'

type SectionHeaderProps = {
  title: React.ReactNode
  description?: React.ReactNode
  variant?: 'divider' | 'underline' | 'plain'
  className?: string
  titleClassName?: string
  descriptionClassName?: string
}

function SectionHeader({
  title,
  description,
  variant = 'divider',
  className,
  titleClassName,
  descriptionClassName,
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className={cn(variant === 'divider' && 'flex items-center gap-4')}>
        <Heading
          as="h2"
          size="h3"
          className={cn(variant === 'underline' && 'border-b border-border/70 pb-2', titleClassName)}
        >
          {title}
        </Heading>
        {variant === 'divider' ? <div className="h-px flex-1 bg-border/70" /> : null}
      </div>
      {description ? <Text variant="muted" className={descriptionClassName}>{description}</Text> : null}
    </div>
  )
}

export { SectionHeader }
