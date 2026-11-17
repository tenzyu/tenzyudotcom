# Approved retirement unit — dated 2026-11-01

The approved work retired **761 tracked files** on `renewal/retire-approved` (base `7753bf43`): `.atelier-bootstrap` 169, old Atelier agents 9, obsolete harness 303, `product/apps/atelier` 207, `product/apps/castalia` 22, retired Web routes/features 46 and five launcher/manifest/workflow/compiler files. Removed Web routes were pointers, puzzles and recommendations. Historical ADRs and two audits remained. This is a historical scope record, not permission to remove further files.

## Preservation

External restore report `../tenzyudotcom-renewal-safety-20261101/restore-report.json` reported matching contents, empty unexpected list and group/metadata differences. Backup SHA-256: `a3d62c82f22151acd3782a3d789798fd36f3d6bf9d465e7079e1f731b9dcf3c2`. The dated report does **not** prove the backup remains on disk today.

## Verification then

Frozen Bun install succeeded; Nx detected six projects; dependency policy, workspace lint, 11 repository tests, devShell evaluations and shell startup succeeded. The shell reported Bun 1.3.13, Node 22.22.3, Biome 2.4.16. The lockfile diff was removal-only: 0 additions, 21 deletions. The initial install timed out before successful retry; Nx initially failed before binary linking.

**Not proven by this unit:** complete Web build/typecheck, real Rust runtime, production deployment. Editor imports and route navigation were fixed by subsequent integration units. Earlier warnings about still-imported deleted route modules describe an **intermediate** state, not final source. A Serena auto-migration modification was restored during the unit.

See the [2026-11-02 closure](12-completion.md) for integrated browser and content evidence, and the [original detailed report](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal/11-retirement-unit.md) for command-by-command logs, protected paths and branch handoffs.
