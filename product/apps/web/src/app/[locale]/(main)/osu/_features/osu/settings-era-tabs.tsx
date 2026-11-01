'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@tenzyu/ui/tabs'
import type { ReactNode } from 'react'
import { DEFAULT_SETTINGS_ERA } from './settings.data'

export function SettingsEraTabs({
  label,
  until2025Label,
  from2026Label,
  until2025,
  from2026,
}: {
  label: string
  until2025Label: string
  from2026Label: string
  until2025: ReactNode
  from2026: ReactNode
}) {
  return (
    <Tabs defaultValue={DEFAULT_SETTINGS_ERA} className="gap-6">
      <TabsList aria-label={label} variant="line">
        <TabsTrigger value="until2025">{until2025Label}</TabsTrigger>
        <TabsTrigger value="from2026">{from2026Label}</TabsTrigger>
      </TabsList>
      <TabsContent value="until2025" className="space-y-4">
        {until2025}
      </TabsContent>
      <TabsContent value="from2026" className="space-y-4">
        {from2026}
      </TabsContent>
    </Tabs>
  )
}
