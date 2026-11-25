# Phase 2 convergence — reviewer handback (candidate, NOT approved)

Status: **awaiting exact-tree CI and independent review**. This is the terminal
DAG node's handoff record, not a declaration that Phase 2 is done.

Baseline develop: `ca801532fd7109c953ad655a729eda5ac44d4d34`.
N0 verified starting point: #89, `dbecaae79c3019595dda9a3f84f5bd8e1480ca5a`.
N8 code candidate: #97, `fc4bcda0e23db10d09939242d3eb8f678ab8dd61`, tree `134bbc8c6a050e2b599abfd167915f880968ec32`.
N9 changes only this handback document; require its own head/tree evidence.
All constituent PRs target develop for CI; their shared history overlaps.
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
| N6 | N1,N3 | #95 | e390282b42288d0cfef343991e089775c817df34 | web-vitals lifecycle, HTTP cache, CDP waterfall; revert N6-only performance changes, keep upstream accessibility fixes |
| N7 | N3 | #96 | 81b874de4234248d022cecc8fa93e8bd5773cf72 | Isolated cold/restored/invalidated Nx UI output proof; remove probe without changing policy |
| N8 | N2,N4,N5,N6,N7 | #97 | fc4bcda0e23db10d09939242d3eb8f678ab8dd61 | Integration only; discard candidate branch if rejected; no production rollback required |
| N9 | N8 | this PR | current head | Review/evidence acceptance; documentation only |

Rollback requires a new reviewed candidate, not a force push or history rewrite.
Before any approved merge, reconcile the actual develop head. Verify all
parent relationships and compare final tree. No deploy or real content write.

## Observed evidence (scoped to these revisions)

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
  not confirmed at record creation. Baseline disposition: [inventory](phase2-disposition.md).
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
  N7 cache run [45650224652](https://github.com/tenzyu/tenzyudotcom/actions/runs/45650224652).

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

## Final acceptance and blockers

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
   authority. Final handback remains incomplete until evidence is collected.

Reproduction: use the committed CI and evidence workflow commands, frozen Bun
lock, exact Git revision, isolated temporary directories and no real content
credentials. Do not enable affected-only verification or remote cache based on
an unverified timing result. No neko7, T3, live authored changes, deploy or merge.
