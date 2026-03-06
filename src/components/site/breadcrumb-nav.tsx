'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useMemo } from 'react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function BreadcrumbNav() {
  const pathname = usePathname()

  const segments = useMemo(() => {
    if (!pathname || pathname === '/') return []

    // Remove empty segments
    const parts = pathname.split('/').filter(Boolean)

    // Map to breadcrumb structure
    return parts.map((part, index) => {
      const href = `/${parts.slice(0, index + 1).join('/')}`
      // Capitalize first letter or custom label mapping could be applied here
      const label = part.charAt(0).toUpperCase() + part.slice(1)

      return {
        label,
        href,
        isLast: index === parts.length - 1,
      }
    })
  }, [pathname])

  if (segments.length === 0) return null

  return (
    <div className="container mx-auto w-full max-w-4xl px-4 py-4 md:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment) => (
            <React.Fragment key={segment.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {segment.isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href}>{segment.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
