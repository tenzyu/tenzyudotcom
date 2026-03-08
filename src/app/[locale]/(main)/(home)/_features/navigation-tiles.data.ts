export type NavigationGroupId = 'outputs' | 'externals'

export type NavigationItemId =
  | 'tools'
  | 'blog'
  | 'portfolio'
  | 'archives'
  | 'links'
  | 'puzzles'
  | 'recommendations'
  | 'pointers'

type NavigationItem = {
  id: NavigationItemId
  href: string
}

type NavigationGroup = {
  id: NavigationGroupId
  items: readonly NavigationItem[]
}

export const HOME_NAVIGATION_GROUPS: readonly NavigationGroup[] = [
  {
    id: 'outputs',
    items: [
      { id: 'tools', href: '/tools' },
      { id: 'blog', href: '/blog' },
      { id: 'portfolio', href: '/portfolio' },
      { id: 'archives', href: '/archives' },
    ],
  },
  {
    id: 'externals',
    items: [
      { id: 'links', href: '/links' },
      { id: 'puzzles', href: '/puzzles' },
      { id: 'recommendations', href: '/recommendations' },
      { id: 'pointers', href: '/pointers' },
    ],
  },
] as const
