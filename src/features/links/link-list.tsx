import { getLocalizedUrl } from 'intlayer'
import Image from 'next/image'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { SectionHeader } from '@/components/site-ui/section-header'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { loadLinks } from '@/features/links/links.assemble'
import { LINK_CATEGORY_ORDER, type LinkCategory, type MyLink } from './links.domain'

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

function LinkIcon({ icon, alt }: { icon: string; alt: string }) {
  return (
    <Image
      src={`/icons/${icon}.svg`}
      width={28}
      height={28}
      alt={alt}
      loading="lazy"
      quality={75}
    />
  )
}

function LinkTile({ link }: { link: MyLink }) {
  const content = useIntlayer('linksFeature')
  const { locale } = useLocale()

  return (
    <Item asChild variant="card" className="w-full">
      <Link
        href={getLocalizedUrl(`/links/${link.shortenUrl}`, locale)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${content.aria.visitPrefix.value} ${link.name} (${link.id})`}
      >
        <ItemMedia variant="avatar" className="dark:bg-secondary-foreground">
          <LinkIcon
            icon={link.icon}
            alt={`${link.name} ${content.aria.iconSuffix.value}`}
          />
        </ItemMedia>

        <ItemContent className="min-w-0 text-left">
          <ItemTitle className="truncate text-sm">{link.name}</ItemTitle>
          <ItemDescription className="truncate text-xs">
            {link.id}
          </ItemDescription>
        </ItemContent>
      </Link>
    </Item>
  )
}
