export const PORTFOLIO_PROFILE_IMAGE_PATH = '/images/my-icon.png' as const

export type PortfolioAboutLinkId = 'blog' | 'github' | 'x'

type PortfolioAboutLink = {
  id: PortfolioAboutLinkId
  url: string
}

export const PORTFOLIO_ABOUT_LINKS: readonly PortfolioAboutLink[] = [
  {
    id: 'blog',
    url: 'https://tenzyu.com/blog',
  },
  {
    id: 'github',
    url: 'https://github.com/tenzyu',
  },
  {
    id: 'x',
    url: 'https://x.com/tenzyudotcom',
  },
] as const

export type PortfolioProjectId =
  | 'personalWebsite'
  | 'osuBpDatabase'
  | 'osuSkinRemixer'

type PortfolioProject = {
  id: PortfolioProjectId
  technologies: readonly string[]
  github?: string
  demo?: string
}

export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: 'personalWebsite',
    technologies: ['TypeScript', 'NextJS'],
    github: 'https://github.com/tenzyu/tenzyudotcom',
    demo: 'https://tenzyu.com',
  },
  {
    id: 'osuBpDatabase',
    technologies: ['TypeScript', 'NextJS', 'Postgres', 'Deno'],
    demo: 'https://youtu.be/d7cvjRIH4wI',
  },
  {
    id: 'osuSkinRemixer',
    technologies: ['TypeScript', 'NextJS'],
    demo: 'https://youtu.be/2ooDARE6KN8',
  },
] as const

export type PortfolioExperienceId =
  | 'webDevelopmentCompany'
  | 'systemsDevelopmentCompany'
  | 'inHouseServiceCompany'

type PortfolioExperience = {
  id: PortfolioExperienceId
  technologies: readonly string[]
}

export const PORTFOLIO_EXPERIENCES: readonly PortfolioExperience[] = [
  {
    id: 'webDevelopmentCompany',
    technologies: ['TypeScript', 'Laravel'],
  },
  {
    id: 'systemsDevelopmentCompany',
    technologies: ['TypeScript', 'React', 'Laravel', 'PostgreSQL'],
  },
  {
    id: 'inHouseServiceCompany',
    technologies: ['TypeScript', 'React', 'Cloud Functions', 'Firestore'],
  },
] as const

export type PortfolioEnvironmentId = 'neko3' | 'neko5' | 'neko6' | 'neko7'

type PortfolioEnvironment = {
  id: PortfolioEnvironmentId
  title: string
  os: string
  role: string
}

export const PORTFOLIO_ENVIRONMENTS: readonly PortfolioEnvironment[] = [
  {
    id: 'neko3',
    title: 'neko3 (Windows 11 Host)',
    os: 'Windows 11',
    role: 'Parsec Host',
  },
  {
    id: 'neko5',
    title: 'neko5 (Main Development Machine)',
    os: 'NixOS',
    role: 'Primary',
  },
  {
    id: 'neko6',
    title: 'neko6 (WSL2 on neko3)',
    os: 'NixOS (WSL2)',
    role: 'SSH Target',
  },
  {
    id: 'neko7',
    title: 'neko7 (Remote Server)',
    os: 'NixOS',
    role: 'Remote VM',
  },
] as const
