import { BackToHome } from '@/components/common/back-to-home'

import { AboutMeSection } from './_components/about-me-section'
import { DevEnvironmentSection } from './_components/dev-environment-section'
import { ExperienceSection } from './_components/experience-section'
import { PhilosophySection } from './_components/philosophy-section'
import { ProjectsSection } from './_components/project-section'

export default function PortfolioPage() {
  return (
    <div className="flex justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl space-y-12">
        <BackToHome className="Print:hidden" />
        <AboutMeSection />
        <ExperienceSection />
        <ProjectsSection />
        <PhilosophySection />
        <DevEnvironmentSection />
        <BackToHome className="Print:hidden" />

        {/* --- フッター --- */}
        <footer className="border-border/50 text-muted-foreground mt-12 border-t pt-8 text-center text-xs">
          初版：2025年7月18日 / 最終更新：2026年3月
        </footer>
      </div>
    </div>
  )
}
