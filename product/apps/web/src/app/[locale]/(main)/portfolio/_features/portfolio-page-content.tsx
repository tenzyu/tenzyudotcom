import { useIntlayer } from 'next-intlayer/server'
import { Separator } from '@/components/ui/separator'
import { AboutMeSection } from './about-me-section'
import { DevEnvironmentSection } from './dev-environment-section'
import { ExperienceSection } from './experience-section'
import { PhilosophySection } from './philosophy-section'
import { ProjectsSection } from './project-section'

export function PortfolioPageContent() {
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
