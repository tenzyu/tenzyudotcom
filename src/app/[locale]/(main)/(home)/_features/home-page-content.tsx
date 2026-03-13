import { useIntlayer } from 'next-intlayer/server'
import { HomeHero } from './home-hero'
import { HomeNowSection } from './home-now-section'
import { HomePathways } from './home-pathways'
import { NavigationTiles } from './navigation-tiles'
import { SelfieGallerySection } from './selfie-gallery-section'

export function HomePageContent({ locale }: { locale: string }) {
  const home = useIntlayer('page-home')

  return (
    <>
      <HomeHero />
      <HomeNowSection locale={locale} />
      <div className="py-3" />
      <HomePathways locale={locale} />
      <div className="py-3" />
      <NavigationTiles />
      <div className="py-4" />
      <SelfieGallerySection
        title={home.timeline.value}
        description={home.timelineDesc.value}
      />
    </>
  )
}
