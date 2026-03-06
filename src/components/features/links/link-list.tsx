import { MY_LINKS, type LinkCategory } from '@/data/links'

import { LinkCard } from './link-card'
import { ItemGroup } from '@/components/ui/item'
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
              <h2 className="text-xl font-bold tracking-tight">
                {group.label}
              </h2>
              <nav aria-label={`${group.label} links`}>
                <ItemGroup className="xs:grid-cols-2 grid grid-cols-1 gap-4 p-0 sm:grid-cols-3">
                  {group.links.map((link) => (
                    <LinkCard key={link.shortenUrl} link={link} />
                  ))}
                </ItemGroup>
              </nav>
            </section>
          ),
      )}
    </div>
  )
}
