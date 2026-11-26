import { getLocalizedUrl } from 'intlayer'
import Image from 'next/image'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { Content } from '@/components/site/content'
import { SectionHeader } from '@/components/site/section-header'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@tenzyu/ui/item'
import { loadLinks } from '@/features/links/links.assemble'
import {
  LINK_CATEGORY_ORDER,
  type LinkCategory,
  type MyLink,
} from '@tenzyu/publishing-domain/links'

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
  const pageContent = useIntlayer('page-osu-profile')
  const links = await loadLinks().catch(() => null)

  if (links === null) {
    return (
      <Content size="2xl">
        <p role="status" className="text-muted-foreground">
          {pageContent.linksUnavailable.value}
        </p>
      </Content>
    )
  }

  const groupedLinks = LINK_CATEGORY_ORDER.map((category) => ({
    value: category,
    label: content.categories[CATEGORY_KEYS[category]],
    links: links.filter((link) => link.category === category),
  }))

  return (
    <Content size="2xl" className="space-y-6">
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
                <ul className="xs:grid-cols-2 grid grid-cols-1 gap-4 p-0 sm:grid-cols-3 list-none">
                  {group.links.map((link) => (
                    <LinkTile key={link.shortenUrl} link={link} />
                  ))}
                </ul>
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
  const { locale } = useLocale()

  return (
    <li>
    <Item
      variant="outline"
      className="w-full pr-11"
      render={
        <Link
          href={getLocalizedUrl(`/links/${link.shortenUrl}`, locale)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ItemMedia variant="icon" className="dark:bg-secondary-foreground">
            <LinkIcon
              icon={link.icon}
              alt=""
            />
          </ItemMedia>

          <ItemContent className="min-w-0 text-left">
            <ItemTitle className="truncate text-sm">{link.name}</ItemTitle>
            <ItemDescription className="truncate text-xs">
              {link.id}
            </ItemDescription>
          </ItemContent>
        </Link>
      }
    />
    </li>
  )
}
