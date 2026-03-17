import { useIntlayer } from 'next-intlayer/server'
import { HomeHero } from './home-hero'
import { HomeLatestFragments } from './home-latest-fragments'
import { HomeNowSection } from './home-now-section'
import { NavigationTiles } from './navigation-tiles'
import { SelfieGallerySection } from './selfie-gallery-section'

type HomePageContentProps = {
  locale: string
  latestNotes: {
    body: string
    createdAt: string
  }[]
  latestPost?: {
    slug: string
    metadata: {
      title: string
      summary: string
      publishedAt: Date
    }
  }
}

export function HomePageContent({
  locale,
  latestNotes,
  latestPost,
}: HomePageContentProps) {
  const home = useIntlayer('page-home')

  return (
    <>
      <HomeHero />
      <HomeNowSection locale={locale} />
      <div className="py-3" />
      <HomeLatestFragments
        locale={locale}
        latestNotes={latestNotes}
        latestPost={latestPost}
      />
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
