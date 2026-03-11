---
name: dependency-cruiser-config-proposal
description: 現行 .dependency-cruiser.cjs の取りこぼしと、actions.ts や route-local _features も検知できる修正版設定案を記録する。
summary: 現行設定は .tsx 側しか contract 直依存を見ておらず、Server Action の .ts mount point を取りこぼす。_features cross-route rule も実パスに合っていないため、修正版の regex と forbidden ルール案を示す。
read_when:
  - dependency-cruiser の精度を上げたいとき
  - actions.ts や route.ts の境界違反を検知したいとき
  - local-first / dependency-inversion の自動検知を見直すとき
user-invocable: false
---

# Dependency Cruiser Config Proposal

## Current Gaps

- `*.tsx` だけを UI-facing module と見なしているため、`actions.ts` `route.ts` `metadata.actions.ts` のような `.ts` entrypoint から `*.contract.ts` への直依存を検知できない
- `src/app/.../_features/...` 同士の cross-route 依存を防ぐつもりの rule が、`(^_features/)` という実パスに存在しない pattern を使っており、実効性が薄い
- `src/features/` の昇格判定 rule はあるが、`src/app/.../_features/` 側の isolation が弱いため local-first 逸脱の片側しか見られていない

## Proposed Config

```js
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name:
        'Route-local _features must not depend on another route-local _features slice in a different route.',
      severity: 'error',
      from: {
        path: '^src/app/(.+)/_features/',
      },
      to: {
        path: '^src/app/(.+)/_features/',
        pathNot: '^src/app/$1/_features/',
      },
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
        'UI-facing and app entrypoint modules must not depend directly on infrastructure contracts.',
      severity: 'error',
      from: {
        path: '^src/(app|components|features)/.*\\.(ts|tsx)$',
        pathNot: [
          '^src/.*\\.(contract|port|domain|assemble|test|spec)\\.ts$',
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
```

## Why This Version Is Better

- `actions.ts` や `route.ts` も `UI-facing and app entrypoint modules` として扱うため、今回のような `actions.ts -> *.contract.ts` 依存を検知できる
- `from.path: '^src/app/(.+)/_features/'` により、実際の route-local path に一致する
- `pathNot: '^src/app/$1/_features/'` により、同じ route slice 内の依存は許可しつつ、別 route の `_features` 参照だけを落とせる
- `contract|port|domain|assemble` 自身は除外するため、dependency inversion の owner である layer 定義ファイルに誤爆しにくい

## Expected Detections

- `src/app/[locale]/(admin)/editor/_features/actions.ts` から `src/lib/editor/editor.contract.ts` の直 import
- `src/app/.../_features/...` から別 route の `src/app/.../_features/...` への import
- `src/features/...` から route-local `_features` への逆流 import

## Notes

- dependency-cruiser の regex replacement は rule ごとに癖があるため、実導入時は意図的な violation fixture を 2, 3 個作って確認した方がよい
- もし `from.path` と `to.pathNot` の backreference が期待通り効かない場合は、route boundary ごとに rule を分けるか、fixture ベースで調整する
