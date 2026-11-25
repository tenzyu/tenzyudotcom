import { getLocalizedUrl } from 'intlayer'
import Image from 'next/image'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { Content } from '@/components/site/content'
import { PageHeader } from '@/components/site/page-header'
import { SectionHeader } from '@/components/site/section-header'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@tenzyu/ui/item'
import { loadLinks } from '@/features/links/links.assemble'
import { LINK_CATEGORY_ORDER, type MyLink } from '@tenzyu/publishing-domain/links'
import { LinkControls } from './link-controls'

export async function LinkTreePageContent() {
  const content = useIntlayer('page-links')
  const linksContent = useIntlayer('linksFeature')
  const { locale } = useLocale()
  const links = await loadLinks()
  const groupedLinks = LINK_CATEGORY_ORDER.map((category) => ({
    category,
    label:
      category === 'Watch'
        ? linksContent.categories.watch.value
        : category === 'Social'
          ? linksContent.categories.social.value
          : category === 'Build'
            ? linksContent.categories.build.value
            : linksContent.categories.legacy.value,
    links: links.filter((link) => link.category === category),
  }))

  return (
    <>
      <PageHeader
        title={content.metadata.title.value}
        description={content.metadata.description.value}
      />
      <Content size="2xl" className="space-y-6">
        <div className="flex justify-end">
          <LinkControls locale={locale || 'ja'} />
        </div>
        {groupedLinks.map(
          (group) =>
            group.links.length > 0 && (
              <section key={group.category} className="space-y-4">
                <SectionHeader
                  title={group.label}
                  titleClassName="text-xl"
                  className="space-y-1"
                />
                <nav
                  aria-label={`${group.label} ${linksContent.aria.groupLabelSuffix.value}`}
                >
                  <ItemGroup className="xs:grid-cols-2 grid grid-cols-1 gap-4 p-0 sm:grid-cols-3">
                    {group.links.map((link) => (
                      <LinkTile
                        key={link.shortenUrl}
                        link={link}
                        locale={locale || 'ja'}
                        visitPrefix={linksContent.aria.visitPrefix.value}
                      />
                    ))}
                  </ItemGroup>
                </nav>
              </section>
            ),
        )}
      </Content>
    </>
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

function LinkTile({
  link,
  locale,
  visitPrefix,
}: {
  link: MyLink
  locale: string
  visitPrefix: string
}) {
  return (
    <div role="listitem" className="relative">
      <div className="absolute top-2 right-2 z-10">
        <LinkControls locale={locale} shortCode={link.shortenUrl} />
      </div>
      <Item
        variant="outline"
        className="w-full pr-11"
        render={
          <Link
            href={getLocalizedUrl(`/links/${link.shortenUrl}`, locale)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${link.name} ${link.id} — ${visitPrefix}`}
          >
            <ItemMedia variant="icon" className="dark:bg-secondary-foreground">
              <LinkIcon icon={link.icon} alt="" />
            </ItemMedia>

            <ItemContent className="min-w-0 text-left">
              <ItemTitle className="truncate text-sm">{link.name}</ItemTitle>
              <ItemDescription className="truncate text-xs">
                {link.id}
              </ItemDescription>
            </ItemContent>
          </Link>
        }
      ></Item>
    </div>
  )
}
