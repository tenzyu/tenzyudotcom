/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // local-first, promote-later
    {
      name:
        "One feature should not depend on another feature (in a separate folder). Move these features under src/features",
      severity: "error",
      from: { path: "(^_features/)([^/]+)/" },
      to: { path: "^$1", pathNot: "$1$2" },
    },
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
    
    // dependency invesion
    {
      name:
        'UI-facing .tsx modules should not depend directly on infrastructure contracts. Move helpers out of *.contract.ts or depend on domain/assemble layers instead.',
      severity: 'error',
      from: {
        path: '^(src/app|src/components|src/features)/.*\\.tsx$',
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
