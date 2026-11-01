import { HomeHero } from './home-hero'
import { HomeLatestFragments } from './home-latest-fragments'
import { NavigationTiles } from './navigation-tiles'

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
  return (
    <>
      <HomeHero locale={locale} />
      <HomeLatestFragments
        locale={locale}
        latestNotes={latestNotes}
        latestPost={latestPost}
      />
      <NavigationTiles />
    </>
  )
}
