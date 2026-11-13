import { cn } from '@tenzyu/ui'

type LinkPrimitiveProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  external?: boolean
}

function LinkPrimitive({
  className,
  external,
  rel,
  target,
  ...props
}: LinkPrimitiveProps) {
  return (
    <a
      className={cn(
        'text-link underline underline-offset-4 transition-colors visited:text-link-visited hover:text-primary focus-visible:rounded-xs',
        className
      )}
      target={external ? (target ?? '_blank') : target}
      rel={external ? (rel ?? 'noopener noreferrer') : rel}
      {...props}
    />
  )
}

export { LinkPrimitive }
