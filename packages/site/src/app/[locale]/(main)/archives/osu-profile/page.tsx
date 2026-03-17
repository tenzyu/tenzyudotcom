import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider } from 'next-intlayer/server'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { OsuProfileContent } from './_features/page-content'

import './legacy.css'

export const revalidate = 60

export const generateMetadata = createPageMetadata('page-osu-profile', {
  pathname: '/archives/osu-profile',
})

const OsuProfileArchive: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <OsuProfileContent />
    </IntlayerServerProvider>
  )
}

export default OsuProfileArchive
