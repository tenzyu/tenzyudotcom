import type { Metadata } from 'next'

import { AboutMeSection } from './_components/about-me-section'
import { DevEnvironmentSection } from './_components/dev-environment-section'
import { ExperienceSection } from './_components/experience-section'
import { PhilosophySection } from './_components/philosophy-section'
import { ProjectsSection } from './_components/project-section'
import { Separator } from '@/components/ui/separator'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'Portfolio',
  description: 'これまでの経歴やスキル、制作物などをまとめています。',
}

export default function PortfolioPage() {
  return (
    <>
      <AboutMeSection />
      <ProjectsSection />
      <ExperienceSection />
      <PhilosophySection />
      <DevEnvironmentSection />

      {/* --- フッター --- */}
      <footer className="text-muted-foreground mt-12 text-center text-xs">
        <Separator className="bg-border/50 mb-6" />
        初版：2025年7月18日 / 最終更新：2026年3月
      </footer>
    </>
  )
}
