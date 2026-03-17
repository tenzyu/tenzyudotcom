export type PublicRouteGroupId = 'core' | 'around'

export type PublicRouteId =
  | 'tools'
  | 'blog'
  | 'notes'
  | 'portfolio'
  | 'archives'
  | 'links'
  | 'puzzles'
  | 'recommendations'
  | 'pointers'

type PublicRoute = {
  href: string
  groupId: PublicRouteGroupId
}

type PublicRouteGroup = {
  id: PublicRouteGroupId
  routeIds: readonly PublicRouteId[]
}

export const PUBLIC_ROUTES = {
  tools: {
    href: '/tools',
    groupId: 'core',
  },
  blog: {
    href: '/blog',
    groupId: 'core',
  },
  notes: {
    href: '/notes',
    groupId: 'core',
  },
  portfolio: {
    href: '/portfolio',
    groupId: 'core',
  },
  archives: {
    href: '/archives',
    groupId: 'around',
  },
  links: {
    href: '/links',
    groupId: 'core',
  },
  puzzles: {
    href: '/puzzles',
    groupId: 'around',
  },
  recommendations: {
    href: '/recommendations',
    groupId: 'around',
  },
  pointers: {
    href: '/pointers',
    groupId: 'around',
  },
} as const satisfies Record<PublicRouteId, PublicRoute>

export const PUBLIC_ROUTE_GROUPS = [
  {
    id: 'core',
    routeIds: ['blog', 'notes', 'tools', 'portfolio', 'links'],
  },
  {
    id: 'around',
    routeIds: ['recommendations', 'pointers', 'puzzles', 'archives'],
  },
] as const satisfies readonly PublicRouteGroup[]

export const PRIMARY_NAV_ROUTE_IDS = [
  'blog',
  'notes',
  'tools',
  'links',
  'portfolio',
] as const satisfies readonly PublicRouteId[]

export type PrimaryNavRouteId = (typeof PRIMARY_NAV_ROUTE_IDS)[number]
