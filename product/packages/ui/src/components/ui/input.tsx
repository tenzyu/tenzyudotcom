import { cn } from '../../lib/cn'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input bg-input text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground min-h-[var(--tz-min-target)] w-full min-w-0 rounded-[var(--radius-md)] border px-3 py-2 text-base shadow-sm transition-[color,box-shadow,border-color,background] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-[var(--tz-focus-ring-width)] focus-visible:ring-ring/40',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
