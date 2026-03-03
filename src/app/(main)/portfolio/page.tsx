import { AboutMeSection } from './_components/about-me-section'
import { DevEnvironmentSection } from './_components/dev-environment-section'
import { ExperienceSection } from './_components/experience-section'
import { PhilosophySection } from './_components/philosophy-section'
import { ProjectsSection } from './_components/project-section'

export const dynamic = 'force-static'

export default function PortfolioPage() {
  return (
    <>
      <AboutMeSection />
      <ExperienceSection />
      <ProjectsSection />
      <PhilosophySection />
      <DevEnvironmentSection />

      {/* --- フッター --- */}
      <footer className="border-border/50 text-muted-foreground mt-12 border-t pt-8 text-center text-xs">
        初版：2025年7月18日 / 最終更新：2026年3月
      </footer>
    </>
  )
}
