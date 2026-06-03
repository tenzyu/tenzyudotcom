# Review: RUN-run-update-atelier-product-spec-in-readme-md-81c786517f

## Findings

No blocking issues found in the product-spec update.

## Notes

- The change is documentation-only and scoped to Atelier's product spec and roadmap.
- The updated spec preserves v1 Knowledge Card/context compiler details as current implementation while making the v2 control-plane model canonical.
- The roadmap keeps M0-M12 as shipped baseline and defines M13-M20 as concrete next implementation milestones.
- Durable v2 state is specified under tracked `harness/atelier/`, while `.harness/generated` remains ignored cache. This avoids making generated files a hidden source of truth.

## Test Gaps And Residual Risk

- M13-M20 are not implemented yet.
- Broad `bun nx affected -t check` currently fails because of an unrelated `web:check` TypeScript config issue in `product/apps/web/tsconfig.json`.
