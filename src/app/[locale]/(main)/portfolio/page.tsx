import type { Metadata } from 'next'
import {
  getIntlayer,
  type LocalPromiseParams,
  type NextPageIntlayer,
} from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { Separator } from '@/components/ui/separator'
import { AboutMeSection } from './_components/about-me-section'
import { DevEnvironmentSection } from './_components/dev-environment-section'
import { ExperienceSection } from './_components/experience-section'
import { PhilosophySection } from './_components/philosophy-section'
import { ProjectsSection } from './_components/project-section'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: LocalPromiseParams): Promise<Metadata> {
  const { locale } = await params
  const content = getIntlayer('portfolio', locale)

  return {
    title: content.metadata.title.value,
    description: content.metadata.description.value,
  }
}

const PortfolioPage: NextPageIntlayer = async ({ params }) => {
  const { locale } = await params
  const content = useIntlayer('portfolio', locale)

  return (
    <IntlayerServerProvider locale={locale}>
      <AboutMeSection />
      <ProjectsSection />
      <ExperienceSection />
      <PhilosophySection />
      <DevEnvironmentSection />

      <footer className="text-muted-foreground mt-12 text-center text-xs">
        <Separator className="bg-border/50 mb-6" />
        {content.footer.note}
      </footer>
    </IntlayerServerProvider>
  )
}

export default PortfolioPage
