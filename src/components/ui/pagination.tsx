import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from 'lucide-react'

import { type Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/index'

type PaginationProps = React.ComponentProps<'nav'> & {
  ariaLabel?: string
}

function Pagination({ className, ariaLabel, ...props }: PaginationProps) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: XXX: shadcnui がそうしているから
    <nav
      // biome-ignore lint/a11y/noRedundantRoles: XXX: shadcnui がそうしているから
      role="navigation"
      aria-label={ariaLabel ?? 'pagination'}
      data-slot="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row items-center gap-1', className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>

function PaginationLink({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className,
      )}
      {...props}
    />
  )
}

type PaginationControlProps = React.ComponentProps<typeof PaginationLink> & {
  label?: string
  ariaLabel?: string
}

function PaginationPrevious({
  className,
  label,
  ariaLabel,
  ...props
}: PaginationControlProps) {
  return (
    <PaginationLink
      aria-label={ariaLabel ?? 'Go to previous page'}
      size="default"
      className={cn('gap-1 px-2.5 sm:pl-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{label ?? 'Previous'}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  label,
  ariaLabel,
  ...props
}: PaginationControlProps) {
  return (
    <PaginationLink
      aria-label={ariaLabel ?? 'Go to next page'}
      size="default"
      className={cn('gap-1 px-2.5 sm:pr-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">{label ?? 'Next'}</span>
      <ChevronRightIcon />
    </PaginationLink>
  )
}

type PaginationEllipsisProps = React.ComponentProps<'span'> & {
  label?: string
}

function PaginationEllipsis({
  className,
  label,
  ...props
}: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex size-9 items-center justify-center', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">{label ?? 'More pages'}</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
