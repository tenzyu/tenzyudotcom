import { getLocalizedUrl } from 'intlayer'
import Link from 'next/link'
import { useIntlayer, useLocale } from 'next-intlayer/server'
import { EditorialEntry, EditorialList } from '@tenzyu/ui/editorial'
import { SectionHeader } from '@/components/site/section-header'
import {
  PRIMARY_NAV_ROUTE_IDS,
  PUBLIC_ROUTES,
} from '@/features/site-navigation/public-routes.data'

export function NavigationTiles() {
  const { locale } = useLocale()
  const navigation = useIntlayer('navigationTiles', locale)
  const home = useIntlayer('page-home', locale)

  return (
    <section className="space-y-6">
      <SectionHeader
        title={home.siteIndexTitle}
        description={home.siteIndexSubtitle}
      />
      <EditorialList>
        {PRIMARY_NAV_ROUTE_IDS.map((routeId) => (
          <EditorialEntry key={routeId}>
            <Link
              href={getLocalizedUrl(PUBLIC_ROUTES[routeId].href, locale)}
              className="group grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-6"
            >
              <h3 className="font-serif text-xl group-hover:text-primary group-hover:underline">
                {navigation.items[routeId].label}
              </h3>
              <p className="text-sm leading-7 text-muted-foreground">
                {navigation.items[routeId].description}
              </p>
            </Link>
          </EditorialEntry>
        ))}
      </EditorialList>
    </section>
  )
}
