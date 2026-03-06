'use client'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { useIntlayer } from 'next-intlayer'
import { useLocale } from 'next-intlayer'
import { getLocalizedUrl } from 'intlayer'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Content } from '@/components/site/content'

export function BreadcrumbNav() {
  const [mounted, setMounted] = useState(false)
  const { locale, pathWithoutLocale } = useLocale()
  const content = useIntlayer('breadcrumb')

  useEffect(() => {
    setMounted(true)
  }, [])

  const segments = useMemo(() => {
    const pathname = pathWithoutLocale ?? '/'
    if (!pathname || pathname === '/') return []

    // Remove empty segments
    const parts = pathname.split('/').filter(Boolean)

    // Map to breadcrumb structure
    return parts.map((part, index) => {
      const href = `/${parts.slice(0, index + 1).join('/')}`
      const label =
        content.labels[part as keyof typeof content.labels] ??
        part.charAt(0).toUpperCase() + part.slice(1)

      return {
        label,
        href: getLocalizedUrl(href, locale),
        isLast: index === parts.length - 1,
      }
    })
  }, [pathWithoutLocale, content, locale])

  if (!mounted || segments.length === 0) return null

  return (
    <Content size="4xl" className="px-4 py-4 md:py-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={getLocalizedUrl('/', locale)}>{content.home}</Link>
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
    </Content>
  )
}
