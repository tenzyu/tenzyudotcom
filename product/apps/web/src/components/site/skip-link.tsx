import { cn } from '@tenzyu/ui/cn'

function SkipLink({
  href = '#main-content',
  className,
  children = '本文へ移動',
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-[var(--radius-md)] focus:border focus:border-ring focus:bg-popover focus:px-4 focus:py-3 focus:text-popover-foreground focus:shadow-[var(--shadow-lifted)]',
        className,
      )}
      {...props}
    >
      {children}
    </a>
  )
}

export { SkipLink }
