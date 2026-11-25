# Phase 2 convergence — evidence review and reviewer handback

Status: **N8 accepted into develop; full Phase 2 DoD remains open.**
Final artifact review was performed by the implementing assistant, not an independent reviewer.
No production promotion or WCAG conformance claim.

Baseline develop: `ca801532fd7109c953ad655a729eda5ac44d4d34`.
N0 verified starting point: #89, `dbecaae79c3019595dda9a3f84f5bd8e1480ca5a`.
N8 code candidate: #97, `43a2dd6b800d36314a7767c70b1e30e52bba53c9`, tree `86ee5d0b55ed3c5119acbff4cda8a063afb3feca`.
N8 merged into develop as `f31a992fcb7638540d9f7abf523c143160ee65b4`; actual develop tree matches the tested N8 tree.
N9 changes only this handback document. Topic PRs target their DAG prerequisites; #97 was the sole code delivery boundary.
The pre-rewrite SHAs below identify historical evidence; original history is retained at `archive/phase2-before-history-rewrite-b630b18`.
Do not merge them independently or squash their cumulative diffs in sequence.

## DAG and rollback

| Node | Depends on | PR | Integrated semantic head | Scope / rollback |
|---|---|---|---|---|
| N0 | develop | #89 | dbecaae79c3019595dda9a3f84f5bd8e1480ca5a | Baseline combined quality changes |
| N1 | N0 | #90 | 9563d2b7af81f08de76134a99cf1f90f0574c2f5 | Accessible names, list semantics, contrast, axe checks; revert N1 semantic changes with dependent N6 |
| N2 | N0 | #91 | 6fa6db3c705b7822ea828db606b15a1dcd3f2b5f | Editor trust, session parser, pinned/fresh persistence; revert together with relevant tests |
| N3 | N0 | #92 | a7754eeea84650cd6d43f3435f45a6f96f472eac | Output lease, cancellation, inventory; revert N3 with N6/N7 dependents |
| N4 | N0 | #93 | 05d9fa2c0bc7d14213ecf762ed8eff3c40ba0752 | Exporter injection, native framing, actual Firefox fixture; revert product and acceptance changes as a unit |
| N5 | N0 | #94 | 487d9e7a4fe04f9377f1139776025115befc43c1 | Native release executable and real WebView IPC acceptance; revert runner and harness changes |
| N6 | N1,N3 | #95 | 186db559bb25929fd7871ab8fea22df889bdb2fd | web-vitals lifecycle, HTTP cache, CDP waterfall; revert N6-only performance changes, keep upstream accessibility fixes |
| N7 | N3 | #96 | 81b874de4234248d022cecc8fa93e8bd5773cf72 | Isolated cold/restored/invalidated Nx UI output proof; remove probe without changing policy |
| N8 | N2,N4,N5,N6,N7 | #97 | 8f329f92a1e01971c64a28a9dbdb50ce898c4343 | Integration only; discard candidate branch if rejected; no production rollback required |
| N9 | N8 | this PR | current head | Review/evidence acceptance; documentation only |

Rollback requires a new reviewed candidate, not a force push or history rewrite.
Before any approved merge, reconcile the actual develop head. Verify all
parent relationships and compare final tree. No deploy or real content write.

## Historical evidence (scoped to pre-rewrite revisions; superseded by final measurements below)

- N0 normal CI: [45642609487](https://github.com/tenzyu/tenzyudotcom/actions/runs/45642609487);
  quality [45642609632](https://github.com/tenzyu/tenzyudotcom/actions/runs/45642609632).
  Both successful (six jobs). Artifacts: 15036187011 publication/editor,
  15036856465 cross-browser and quality, 15036660857 package audit,
  15036356432 architecture.
- N0 publication: 22 revisions/244 requests; editor 6/6;
  cross-browser 18/18 on synthetic content. Audit returned zero reported advisories;
  not a claim of absence of all vulnerabilities.
- N1 first candidate `7e6807520ecdaa6c803f2717d0e252c599535906`:
  [quality 45649121815](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649121815),
  artifact 15039737060, 72 axe scans. [CI 45649121903](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649121903)
  failed semantic-element lint in two list wrappers. Follow-up uses native ul/li,
  removes overriding names, changes tablet-label contrast, adds failure details
  and a stricter rule gate; **not yet measured**.
- N2 exact head passed [CI 45649320864](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649320864)
  and [quality 45649320959](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649320959).
- N3 quality [45649419550](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649419550) passed.
  Normal [45649419568](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649419568)
  passed. Baseline disposition: [inventory](phase2-disposition.md).
- N4 Firefox 160.0 / GeckoDriver 0.37.1: 23 unit tests and actual download passed,
  but native-mode acceptance failed because WebDriver content context cannot
  navigate an extension options URL ([45649936984](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649936984)).
  Follow-up uses actual extension storage API in temporary XPI and disables
  fallback to download. Options UI itself remains outside this automation.
- N5 [45649751760](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649751760)
  failed installation on ubuntu-26.04: webkit2gtk-driver unavailable.
  Follow-up pins native runner to ubuntu-24.04, whose repository provides the
  matching WebKitGTK driver. Runtime success still unverified.
- N6/N7 new probes must produce actual metrics/cache results, not merely green
  test process exits. Earlier N6 ancestor [45649839977](https://github.com/tenzyu/tenzyudotcom/actions/runs/45649839977);
  N7 cache run [45650224652](https://github.com/tenzyu/tenzyudotcom/actions/runs/45650224652) passed; artifact contents still require review. Earlier N6 failed browser callback initialization (job 139331016911); follow-up bundles the installed library with Bun for the browser. Latest metrics remain unverified.

### Before/after axe evidence (same 72-scan fixture)

| Rule | N0 scan-rule occurrences / affected nodes | N1 first scan-rule occurrences / affected nodes |
|---|---:|---:|
| label-content-name-mismatch | 72 / 116 | 20 / 20 |
| aria-required-children | 16 / 16 | 0 / 0 |
| target-size | 8 / 8 | 0 / 0 |
| color-contrast | 6 / 8 | 6 / 8 |

Axe is automated inventory, not WCAG conformance. Residual N1 contrast occurs on
Japanese/English osu routes; inspect node failure summaries on latest candidate.
No numerical result is claimed for follow-up commits. Manual keyboard, screen
reader, contrast, zoom/reflow and other non-automatable criteria require review.

## Original acceptance criteria and remaining boundaries

1. Full CI and quality evidence for **same candidate tree**, including graph and
   policy enforcement, publication, editor, runtime fixtures and package audit.
   Record run/job URLs, artifact IDs, observed exit statuses and tree hashes.
2. Audit every repo-ops baseline path disposition; compare actual tracked source
   counts, ownership, dependency edges and task graph with N0/develop. Distinguish
   LOC and changed paths from measured change amplification/agent context cost.
   Do not assert a cost reduction from fewer files alone.
3. Read Nx cold/warm/invalidated cache logs and hashes; confirm cache hit,
   restored byte equality and invalidation. Compare same-runner durations.
4. Read browser reports; confirm valid official web-vitals lifecycle samples
   (including interaction INP), cold vs warm cache evidence and resource
   initiator/timing waterfall. No field p75 claim; real traffic is outside fixture.
5. Verify actual Firefox native output as well as download, stable DOM injection,
   malformed/large cases and permission scope. Verify Linux WebView launches and
   actual IPC import/refresh with isolated filesystem. No Windows/macOS bundle claim.
6. Reproduce cancellation/lease exclusion/teardown; check session expiry/rotation,
   origin denial, stale writes, cache refresh and publication consistency.
   Distributed rate limits, individual token revocation, and deployment ingress
   are owner/infra decisions; do not invent an external service or access secrets.
7. Independent review of residual issues, explicit risk acceptance and merge
   authority. Final artifact evidence has now been collected; independent review and remaining owner decisions are still open.

Reproduction: use the committed CI and evidence workflow commands, frozen Bun
lock, exact Git revision, isolated temporary directories and no real content
credentials. Do not enable affected-only verification or remote cache based on
an unverified timing result. No neko7, T3, live authored changes or deployment.

## Final evidence review — 2026-11-26 JST

N8 head `43a2dd6b800d36314a7767c70b1e30e52bba53c9`, tree `86ee5d0b55ed3c5119acbff4cda8a063afb3feca`. Normal CI synthetic merge checkout d985b3c8 had the identical tree. N9 original documentation-only candidate `4fbd8403d572fd6068ef2309385a8bb7df561e19`, tree `fac8dccac61e53656fe7a6cc25d02de5309f977d`, independently passed all four workflows. This revision updates only the handback; code evidence binds to N8 and the original N9, not to an unobserved new run.

| Workflow | N8 run / artifact IDs | Original N9 run / artifact IDs |
|---|---|---|
| CI | [45652209924](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652209924), 15042551346 | [45652208729](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652208729), 15040698818 |
| Quality | [45652210384](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652210384), 15042825389, 15041379614, 15041214172 | [45652208949](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652208949), 15041454566, 15042155766, 15042425391 |
| Nx cache | [45652209972](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652209972), 15040799856 | [45652208884](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652208884), 15041333417 |
| Firefox runtime | [45652209955](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652209955), job 139347285669 | [45652208740](https://github.com/tenzyu/tenzyudotcom/actions/runs/45652208740), job 139344537975 |

All 10 artifacts inspected. Both candidate suites passed: 22 publication revisions / 244 requests; 6 editor tests; 24 public/quality tests (18 cross-browser + 6 quality); zero unexpected/flaky/skipped. Bun audit exit 0, {}. Linux WebKitGTK 2.52.6 release executable launch/list/import/filesystem/refresh passed in job 139347283293; Firefox 160 / GeckoDriver 0.37.1 passed 23 unit tests and real download/native messaging/stable injection in job 139347285669. Options UI and live ChatGPT DOM are outside this fixture. No Windows/macOS bundle or hardware claim.

### Automated accessibility

72 scans, axe 4.14. N0 → N8 rule occurrences: label-content-name-mismatch 72→0; aria-required-children 16→0; target-size 8→0; color-contrast 6→4 (total 102→4). The remaining serious violation is the same pre-existing unselected tab on /osu and /en/osu in light theme on both viewports: selector #base-ui-_R_b7av5uiv7eivb_, tabs-trigger, foreground #7a7973 on #f6f3ed, ratio 3.94:1 versus required 4.5:1. Follow-up: fix the owning tab style, rerun 72 scans and tighten the gate to zero; investigate 24 incomplete rule occurrences and manually review focus, keyboard, zoom/reflow, reduced motion and assistive technology. Initial acceptance permits explicitly tracked existing violations; no WCAG 2.2 AA conformance claim.

### Performance and cache

N8: 84 unthrottled local Chromium navigations, official web-vitals samples present for every metric. p95 nearest rank, 21 samples each.

| Metric | Desktop cold | Desktop warm | Narrow cold | Narrow warm |
|---|---:|---:|---:|---:|
| LCP ms | 224 | 164 | 220 | 144 |
| INP ms | 48 | 40 | 40 | 32 |
| CLS | .0193224 | .0193224 | .0369623 | .0369623 |

Cold/warm CDP cache hits 0/1206; median measured resource transfer 513.8/28.1 KiB per profile; decoded bytes median 1430.7/1409.7 KiB. Zero observed long tasks; largest cold transfer ~1349 KiB on narrow /en/osu. No field p75 or JS-module critical path claim. Nx ui:build baseline cold/warm/invalidated 6.46/1.05/4.05 s, candidate 5.86/1.11/4.29 s. Hash equality within each triplet; real warm cache hit and shared config invalidation miss. One measurement per condition; no statistical speedup or global cache-policy claim.

### Architecture and remaining risk

Runtime owners 29 nodes/81 edges unchanged; runtime modules 412→417 nodes, 808→819 edges; zero cycles and runtime product→repo-ops edges; one unresolved generated IPC projection import and one nonliteral import unchanged. repo-ops 43→53 tracked paths, 240614→277912 bytes. Inventory maps all 43 old paths; no claim of code-size savings, causal change-amplification or agent-context reduction. Representative tasks and comparable CI timing remain to measure.

Trust boundary remains fail-closed but deployment-specific: verify EDITOR_ALLOWED_ORIGIN/SITE_URL, minimum 32-character signing secret, and actual ingress before promotion; process-wide per-instance login budget exposes availability risk, distributed rate limit and per-token revocation are not delivered. No live credential access or live authored writes. SIGKILL of orchestrator/escaped process groups are outside tested cancellation guarantee. Manual review, residual contrast, representative performance/architecture work and independent review are tracked outstanding. Merge into develop is acceptance of the tested incremental improvement only, not completion of every original Phase 2 condition.

Rebuilt semantic heads: #85 7c2595f7; #87 20cd8708; #88 c5328f1d; #89 83a3d98a; #90 7bd72796; #91 01db00eb; #92 07120f48; #93 85e48daf; #94 c7fdeb50; #95 85125115; #96 f13741e5; #97 43a2dd6b. The aggregate merge preserves all of these ancestors. For rollback on develop use a reviewed revert PR; revert the aggregate merge with mainline 1 only if rolling back the entire delivery. Do not rewrite develop history.
