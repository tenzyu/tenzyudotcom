import { getLocalizedUrl } from 'intlayer'
import Image from 'next/image'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { Content } from '@/components/site-ui/content'
import { PageHeader } from '@/components/site-ui/page-header'
import { SectionHeader } from '@/components/site-ui/section-header'
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item'
import { AdminGate } from '@/features/admin/admin-gate'
import { loadLinks } from '@/features/links/links.assemble'
import { LINK_CATEGORY_ORDER, type MyLink } from '@/features/links/links.domain'
import { LinkAddButton } from './link-add-button'
import { LinkAdminMenu } from './link-admin-menu'

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
      <Content size="4xl" className="space-y-6">
        <div className="flex justify-end">
          <AdminGate>
            <LinkAddButton />
          </AdminGate>
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
                      iconSuffix={linksContent.aria.iconSuffix.value}
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
  iconSuffix,
}: {
  link: MyLink
  locale: string
  visitPrefix: string
  iconSuffix: string
}) {
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <AdminGate>
          <LinkAdminMenu shortenUrl={link.shortenUrl} />
        </AdminGate>
      </div>
      <Item asChild variant="card" className="w-full pr-11">
        <Link
          href={getLocalizedUrl(`/links/${link.shortenUrl}`, locale)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${visitPrefix} ${link.name} (${link.id})`}
        >
          <ItemMedia variant="avatar" className="dark:bg-secondary-foreground">
            <LinkIcon
              icon={link.icon}
              alt={`${link.name} ${iconSuffix}`}
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
    </div>
  )
}
