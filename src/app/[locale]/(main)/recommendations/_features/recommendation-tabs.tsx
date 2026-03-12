'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { startTransition } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  applyRecommendationTabParam,
  parseRecommendationTabParam,
  RECOMMENDATION_TAB_PARAM,
} from './recommendation-search-params.domain'
import type { RecommendationTabId } from '@/features/recommendations/recommendations.domain'

type RecommendationTabsProps = {
  tabs: ReadonlyArray<{
    id: RecommendationTabId
    label: string
  }>
  children: React.ReactNode
  className?: string
}

export function RecommendationTabs({
  tabs,
  children,
  className,
}: RecommendationTabsProps) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = parseRecommendationTabParam(
    searchParams.get(RECOMMENDATION_TAB_PARAM),
  )

  function handleTabChange(value: string) {
    const nextTab = parseRecommendationTabParam(value)
    const params = new URLSearchParams(searchParams.toString())
    applyRecommendationTabParam(params, nextTab)

    const nextQuery = params.toString()
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname

    startTransition(() => {
      router.replace(nextUrl, { scroll: false })
    })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className={className}>
      <TabsList className="grid w-full grid-cols-2 md:inline-flex md:w-auto">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  )
}
