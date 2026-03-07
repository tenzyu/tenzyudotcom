import type { NextPageIntlayer } from 'next-intlayer'
import { IntlayerServerProvider, useIntlayer } from 'next-intlayer/server'
import { Separator } from '@/components/ui/separator'
import { createPageMetadata, resolvePageLocale } from '@/lib/intlayer/page'
import { AboutMeSection } from './_features/about-me-section'
import { DevEnvironmentSection } from './_features/dev-environment-section'
import { ExperienceSection } from './_features/experience-section'
import { PhilosophySection } from './_features/philosophy-section'
import { ProjectsSection } from './_features/project-section'

export const dynamic = 'force-static'

export const generateMetadata = createPageMetadata('page-portfolio', {
  pathname: '/portfolio',
})

const PortfolioPageContent = () => {
  const content = useIntlayer('page-portfolio')

  return (
    <>
      <AboutMeSection />
      <ProjectsSection />
      <ExperienceSection />
      <PhilosophySection />
      <DevEnvironmentSection />

      <footer className="text-muted-foreground mt-12 text-center text-xs">
        <Separator className="bg-border/50 mb-6" />
        {content.footer.note}
      </footer>
    </>
  )
}

const PortfolioPage: NextPageIntlayer = async ({ params }) => {
  const locale = await resolvePageLocale(params)

  return (
    <IntlayerServerProvider locale={locale}>
      <PortfolioPageContent />
    </IntlayerServerProvider>
  )
}

export default PortfolioPage
