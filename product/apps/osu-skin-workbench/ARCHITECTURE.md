# Architecture and Dependency Direction

## Dependency Graph

```text
Next routes / app pages
  -> client components / hooks
  -> lib/client API wrappers
  -> HTTP API routes
  -> lib/server services
  -> domain + project builders + classification
  -> filesystem/archive helpers
```

Allowed directions:

- UI may know API DTOs and render models.
- UI must not import `classificationRules` directly.
- Client API wrappers may know route URLs, but not filesystem paths.
- API routes should stay thin and delegate behavior to server services.
- Server services may know filesystem helpers, classification, matrix/tree builders, and manifest storage.
- Domain and classification code must not import UI, HTTP, or filesystem services.

## Current Boundaries

- `src/lib/shared/project-contract.ts` is the HTTP contract.
- `src/lib/shared/asset-dto.ts` sanitizes server-only file paths before responses leave server services.
- `src/hooks/*` owns workspace state and API orchestration for client components.
- `src/lib/domain/*` owns meaning/kind/taxonomy policy.
- `src/lib/project/*` builds matrix/tree/filter models from classified assets.
- `src/lib/server/*` owns filesystem mutation, `.osk` extraction/export, manifests, and project lifecycle.
- `src/lib/classification/rule-catalog.ts` exposes rule ownership groups without making UI depend on raw rules.

## Risks To Avoid

- Do not pass raw `fullPath` or project root paths to browser code.
- Do not let components import classification rules just to build empty UI state.
- Do not add filesystem writes outside server services.
- Do not make `structured` authoritative. It is a generated mirror and may be overwritten.
- Do not add new classification rules without a regression test for at least one representative filename.

## Remaining Deliberate Tradeoffs

- `classification-rules.ts` is still physically large. Rule ownership is now cataloged by group, and physical file splitting should be mechanical after classification coverage is broad enough.
- Preview is still a lightweight decision mock, not a full lazer renderer.
- Styling is still global CSS until component responsibilities settle.
