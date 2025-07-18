import { Section } from '@/components/common/section'

import { AboutMeSection } from './_components/about-me-section'
import { DevEnvironmentSection } from './_components/dev-environment-section'
import { ExperienceSection } from './_components/experience-section'
import { PhilosophySection } from './_components/philosophy-section'
import { ProjectsSection } from './_components/project-section'

export default function PortfolioPage() {
  return (
    <div className="flex flex-col items-center">
      <Section id="about-me" className="w-full max-w-4xl">
        <AboutMeSection />
      </Section>

      <Section id="experience" className="w-full max-w-4xl">
        <ExperienceSection />
      </Section>

      <Section id="projects" className="w-full max-w-4xl">
        <ProjectsSection />
      </Section>

      <Section id="philosophy" className="w-full max-w-4xl">
        <PhilosophySection />
      </Section>

      <Section id="dev-environment" className="w-full max-w-4xl">
        <DevEnvironmentSection />
      </Section>
      {/* --- フッター --- */}
      <footer className="text-muted-foreground mb-8 w-full text-center text-xs">
        初版：2025年7月18日
      </footer>
    </div>
  )
}
