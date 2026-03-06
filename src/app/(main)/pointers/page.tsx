import { ActionLinkTile } from '@/components/site/action-link-tile'
import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import { DASHBOARD_DATA } from '@/data/pointers'

import type { Metadata } from 'next'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Pointers',
  description: 'Quick access dashboard for personal daily use.',
}

export default function PointersPage() {
  return (
    <>
      <PageHeader
        title="Pointers"
        description="Quick access dashboard for personal daily use."
        className="space-y-4"
      />

      <div className="grid gap-12 md:grid-cols-2">
        {DASHBOARD_DATA.map((category) => (
          <section key={category.title} className="space-y-6">
            <SectionHeader
              title={category.title}
              titleClassName="text-lg"
              className="space-y-1"
            />
            <div className="grid gap-4">
              {category.links.map((link) => (
                <ActionLinkTile
                  key={link.name}
                  title={link.name}
                  description={link.description}
                  href={link.url}
                  internal={!!link.isApp}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
