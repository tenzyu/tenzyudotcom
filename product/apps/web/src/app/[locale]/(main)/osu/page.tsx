import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { OsuProfileContent } from './_features/page-content'


export const revalidate = 60

export const generateMetadata = createPageMetadata('page-osu-profile', {
  pathname: '/osu',
})

const OsuPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <OsuProfileContent />
    </IntlayerServerProvider>
  )
}

export default OsuPage
