export const PORTFOLIO_PROFILE_IMAGE_PATH = '/images/my-icon.png' as const

type PortfolioAboutLinkId = 'blog' | 'github' | 'x'

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

type PortfolioProjectId = 'personalWebsite' | 'osuBpDatabase' | 'osuSkinRemixer'

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

type PortfolioExperienceId =
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

type PortfolioEnvironmentId = 'neko5' | 'neko7' | 'nekosm1'

type PortfolioEnvironment = {
  id: PortfolioEnvironmentId
  title: string
  os: string
  role: string
}

export const PORTFOLIO_ENVIRONMENTS: readonly PortfolioEnvironment[] = [
  {
    id: 'neko5',
    title: 'neko5 (Laptop)',
    os: 'NixOS',
    role: 'Tailscale',
  },
  {
    id: 'neko7',
    title: 'neko7 (Remote Server)',
    os: 'NixOS',
    role: 'Development',
  },
  {
    id: 'nekosm1',
    title: 'nekosm1 (Android)',
    os: 'Android',
    role: 'Tailscale',
  },
] as const
