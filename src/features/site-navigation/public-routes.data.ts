export type PublicRouteGroupId = 'outputs' | 'externals'

export type PublicRouteId =
  | 'tools'
  | 'blog'
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
    groupId: 'outputs',
  },
  blog: {
    href: '/blog',
    groupId: 'outputs',
  },
  portfolio: {
    href: '/portfolio',
    groupId: 'outputs',
  },
  archives: {
    href: '/archives',
    groupId: 'outputs',
  },
  links: {
    href: '/links',
    groupId: 'externals',
  },
  puzzles: {
    href: '/puzzles',
    groupId: 'externals',
  },
  recommendations: {
    href: '/recommendations',
    groupId: 'externals',
  },
  pointers: {
    href: '/pointers',
    groupId: 'externals',
  },
} as const satisfies Record<PublicRouteId, PublicRoute>

export const PUBLIC_ROUTE_GROUPS = [
  {
    id: 'outputs',
    routeIds: ['tools', 'blog', 'portfolio', 'archives'],
  },
  {
    id: 'externals',
    routeIds: ['links', 'puzzles', 'recommendations', 'pointers'],
  },
] as const satisfies readonly PublicRouteGroup[]

export const PRIMARY_NAV_ROUTE_IDS = [
  'blog',
  'tools',
  'recommendations',
  'portfolio',
] as const satisfies readonly PublicRouteId[]

export type PrimaryNavRouteId = (typeof PRIMARY_NAV_ROUTE_IDS)[number]
