# Review: RUN-product-apps-atelier-implement-m7-symbolic-id-rename-and-m8-g-43a4795b80

## Findings

- No blocking findings.

## Notes

- `atelier id rename` is preview-by-default and only mutates with `--write`; this matches the harness's "no manual grep" rule and keeps renames reversible.
- The rename refuses when the new id already exists in any harness document, which protects the id table from accidental collisions.
- `atelier generate` produces a stable, deterministic file set: one `atelier.md` skill, one per workflow, one per role, and three short root adapters. Re-running with no source changes is a no-op.
- The regenerated `harness/adapters/root/*.md` files stay under the M8 "short" rule (~34 lines each) and include the four required phrases plus a `tool_source:` pointer back to `harness/adapters/tool/*.md`, which remains the authoritative adapter content.
- Generated skills do not duplicate the full role or workflow body. They reference the canonical role/workflow id and surface only the role bundle, mission summary, scope, and outputs.
- `atelier id rename` only touches backticked body references. Plain-text mentions are intentionally left alone to avoid false positives, and any future work to handle plain text should be a separate flag.
- The pre-existing 6 errors / 40 warnings reported by `atelier doctor` are unchanged and live outside this run's scope.
- All 24 tests pass; the 6 new tests cover M7 preview, M7 write, M7 refuse-on-collision, M7 missing-id, M8 preview, and M8 write/idempotence.
