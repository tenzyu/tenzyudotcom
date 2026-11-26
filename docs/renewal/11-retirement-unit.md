# Approved retirement unit dated 2026-11-01

The approved work retired 761 tracked files on `renewal/retire-approved`, based on `7753bf43`:

- `.atelier-bootstrap`: 169 files
- Old Atelier agents: 9 files
- Obsolete agent tooling: 303 files
- `product/apps/atelier`: 207 files
- `product/apps/castalia`: 22 files
- Retired Web routes and features: 46 files
- Launcher, manifest, workflow and compiler files: 5 files

The removed Web routes were pointers, puzzles and recommendations. Historical ADRs and two audits remained. This is a historical scope record, not permission to remove further files.

## Preservation

The external restore report `../tenzyudotcom-renewal-safety-20261101/restore-report.json` recorded matching contents, no unexpected files and differences in group and metadata. The backup SHA-256 was `a3d62c82f22151acd3782a3d789798fd36f3d6bf9d465e7079e1f731b9dcf3c2`. The dated report does not prove that the backup remains on disk today.

## Verification then

The frozen Bun install succeeded. Nx detected six projects. The dependency policy, workspace lint, 11 repository tests, devShell evaluations and shell startup passed. The shell reported Bun 1.3.13, Node 22.22.3, Biome 2.4.16. The lockfile diff contained 0 additions and 21 deletions. The initial install timed out, then passed on retry. Nx initially failed before binary linking.

This unit did not verify the complete Web build or typecheck, the real Rust runtime or production deployment. Editor imports and route navigation were fixed by subsequent integration units. Earlier warnings about still-imported deleted route modules describe an intermediate state rather than the final source. A Serena auto-migration modification was restored during the unit.

See the [2026-11-02 closure](12-completion.md) for integrated browser and content evidence, and the [original detailed report](https://github.com/tenzyu/tenzyudotcom/tree/c3e70610b4300cdefc4f6bf08c8d84803ba11621/docs/renewal/11-retirement-unit.md) for command-by-command logs, protected paths and branch handoffs.
