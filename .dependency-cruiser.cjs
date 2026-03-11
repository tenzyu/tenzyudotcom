const ROUTE_FEATURE_ROOTS = [
  { root: 'src/app/[locale]/_features' },
  { root: 'src/app/[locale]/(admin)/editor/_features' },
  { root: 'src/app/[locale]/(main)/(home)/_features' },
  { root: 'src/app/[locale]/(main)/archives/_features' },
  { root: 'src/app/[locale]/(main)/archives/osu-profile/_features' },
  {
    root: 'src/app/[locale]/(main)/blog/_features',
    allowWithinDomain: ['src/app/[locale]/(main)/blog/[slug]/_features'],
  },
  {
    root: 'src/app/[locale]/(main)/blog/[slug]/_features',
    allowWithinDomain: ['src/app/[locale]/(main)/blog/_features'],
  },
  { root: 'src/app/[locale]/(main)/links/_features' },
  { root: 'src/app/[locale]/(main)/links/[shortUrl]/_features' },
  { root: 'src/app/[locale]/(main)/notes/_features' },
  { root: 'src/app/[locale]/(main)/pointers/_features' },
  { root: 'src/app/[locale]/(main)/portfolio/_features' },
  { root: 'src/app/[locale]/(main)/puzzles/_features' },
  { root: 'src/app/[locale]/(main)/recommendations/_features' },
  { root: 'src/app/[locale]/(main)/tools/_features' },
  { root: 'src/app/[locale]/(main)/tools/dot-type/_features' },
]

function escapeRegex(value) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, '\\$&')
}

const crossRouteFeatureRules = ROUTE_FEATURE_ROOTS.map(
  ({ root, allowWithinDomain = [] }) => {
    const allowedRoots = [root, ...allowWithinDomain]
    const escapedRoot = escapeRegex(root)

    return {
      name: `Route-local _features under ${root} must not depend on another route-local _features slice.`,
      severity: 'error',
      from: {
        path: `^${escapedRoot}/`,
      },
      to: {
        path: '^src/app/.+/_features/',
        pathNot: allowedRoots.map((allowedRoot) => `^${escapeRegex(allowedRoot)}/`),
      },
    }
  },
)

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...crossRouteFeatureRules,
    {
      severity: 'error',
      name:
        'Modules in src/features/ should only exist after promotion from route-local _features, which requires at least two dependents.',
      from: {
        path: '^src/',
      },
      module: {
        path: '^src/(lib|features)/',
        pathNot: [
          '\\.test\\.(?:ts|tsx)$',
          '\\.content\\.ts$',
          '\\.contract\\.ts$',
          '\\.port\\.ts$',
          '\\.domain\\.ts$',
          '\\.assemble\\.ts$',
        ],
        numberOfDependentsLessThan: 2,
      },
    },
    {
      severity: 'error',
      name:
        'Shared features in src/features/ must not depend on route-local src/app/.../_features modules.',
      from: {
        path: '^src/features/',
      },
      to: {
        path: '^src/app/.+/_features/',
      },
    },
    {
      name:
        'UI-facing modules and server entrypoints must not depend directly on infrastructure contracts.',
      severity: 'error',
      from: {
        path: [
          '^src/(app|components|features)/.*\\.tsx$',
          '^src/app/.*/route\\.ts$',
          '^src/app/.*/actions\\.ts$',
        ],
      },
      to: {
        path: '^src/.*\\.contract\\.ts$',
      },
    },
    {
      name:
        'Domain and port modules must not depend on outer implementation layers like contract or assemble.',
      severity: 'error',
      from: {
        path: '^src/.*\\.(domain|port)\\.ts$',
      },
      to: {
        path: '^src/.*\\.(contract|assemble)\\.ts$',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: '^node_modules',
    },
    includeOnly: ['^src/'],
    exclude: {
      path: [
        '\\.test\\.(?:ts|tsx|js|jsx|mjs)$',
        '\\.spec\\.(?:ts|tsx|js|jsx|mjs)$',
        '\\.d\\.ts$',
        '^storage/',
      ],
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.d.ts'],
    },
  },
}
