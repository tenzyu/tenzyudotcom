import { MY_LINKS, type LinkCategory } from '@/data/links'

import { LinkTile } from './link-tile'
import { ItemGroup } from '@/components/ui/item'
import { SectionHeader } from '@/components/site/section-header'
const CATEGORIES: { label: string; value: LinkCategory }[] = [
  { label: '📺 Watch', value: 'Watch' },
  { label: '🌐 Social', value: 'Social' },
  { label: '🛠️ Build', value: 'Build' },
  { label: '🏛️ Legacy', value: 'Legacy' },
]

export function LinkList() {
  const groupedLinks = CATEGORIES.map((cat) => ({
    ...cat,
    links: MY_LINKS.filter((link) => link.category === cat.value),
  }))

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      {groupedLinks.map(
        (group) =>
          group.links.length > 0 && (
            <section key={group.value} className="space-y-4">
              <SectionHeader
                title={group.label}
                titleClassName="text-xl"
                className="space-y-1"
              />
              <nav aria-label={`${group.label} links`}>
                <ItemGroup className="xs:grid-cols-2 grid grid-cols-1 gap-4 p-0 sm:grid-cols-3">
                  {group.links.map((link) => (
                    <LinkTile key={link.shortenUrl} link={link} />
                  ))}
                </ItemGroup>
              </nav>
            </section>
          ),
      )}
    </div>
  )
}
