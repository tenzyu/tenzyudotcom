import { cn } from '../../lib/cn'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-input text-foreground placeholder:text-muted-foreground flex field-sizing-content min-h-28 w-full rounded-[var(--radius-md)] border px-3 py-2 text-base leading-[var(--tz-leading-readable)] shadow-sm transition-[color,box-shadow,border-color,background] outline-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-[var(--tz-focus-ring-width)] focus-visible:ring-ring/40',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
