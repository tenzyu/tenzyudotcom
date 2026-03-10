import { useIntlayer } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { SectionHeader } from '@/components/site-ui/section-header'
import { ItemGroup } from '@/components/ui/item'
import { loadLinks } from '@/features/links/links.assemble'
import { LINK_CATEGORY_ORDER, type LinkCategory } from './links.domain'
import { LinkTile } from './link-tile'

const CATEGORY_KEYS: Record<
  LinkCategory,
  'watch' | 'social' | 'build' | 'legacy'
> = {
  Watch: 'watch',
  Social: 'social',
  Build: 'build',
  Legacy: 'legacy',
}
export async function LinkList() {
  const content = useIntlayer('linksFeature')
  const links = await loadLinks()
  const groupedLinks = LINK_CATEGORY_ORDER.map((category) => ({
    value: category,
    label: content.categories[CATEGORY_KEYS[category]],
    links: links.filter((link) => link.category === category),
  }))

  return (
    <Content size="4xl" className="space-y-6">
      {groupedLinks.map(
        (group) =>
          group.links.length > 0 && (
            <section key={group.value} className="space-y-4">
              <SectionHeader
                title={group.label.value}
                titleClassName="text-xl"
                className="space-y-1"
              />
              <nav
                aria-label={`${group.label.value} ${content.aria.groupLabelSuffix.value}`}
              >
                <ItemGroup className="xs:grid-cols-2 grid grid-cols-1 gap-4 p-0 sm:grid-cols-3">
                  {group.links.map((link) => (
                    <LinkTile key={link.shortenUrl} link={link} />
                  ))}
                </ItemGroup>
              </nav>
            </section>
          ),
      )}
    </Content>
  )
}
