# Brief: osu-skin-workbench spec document

## title

osu-skin-workbench spec document

## background

The owner provided a consolidated product/specification summary for `osu-skin-workbench` and asked to preserve it as repository documentation.

## problem

The repository had implementation facts and scattered notes, but no durable product spec separating confirmed behavior from design candidates and open questions.

## goal

Create a concise product spec for `osu-skin-workbench` that distinguishes confirmed implementation-backed facts from future design candidates and unresolved decisions.

## scope

- Product specification documentation
- Task record for worktree isolation and handoff

## allowed files

- `harness/knowledge/product-specs/osu-skin-workbench.md`
- `harness/runs/completed/TASK-0014-osu-skin-workbench-spec-doc*`

## forbidden files

- Application source files
- Package source files
- Build configuration

## non-goals

- Implement any workbench feature
- Change Nx/Tauri/package configuration
- Create Pro/private implementation details

## constraints

- Keep confirmed specification separate from design candidates and open questions.
- Do not promote future ideas such as Realm resolver, Pro distribution, or full renderer to implemented facts.

## role assignment

Docs Librarian

## worktree isolation

- Branch: `ai/docs/osu-skin-workbench-spec-doc`
- Worktree path: `/home/tenzyu/Documents/.worktrees/tenzyudotcom/osu-skin-workbench-spec-doc`
- Base branch/commit: `develop` at `e97ef56`
- Expected merge target: `develop`
- Cleanup expectation: remove worktree after review/merge or abandonment

## validation commands

- `git status --short`
- docs readback inspection

## acceptance criteria

- `harness/knowledge/product-specs/osu-skin-workbench.md` exists in the isolated worktree.
- The document separates confirmed facts, non-goals, design candidates, and open questions.
- No source code changes are made.

## risks

- The document combines implementation-backed facts with owner-provided future direction; future-oriented sections must remain labeled as candidates or open questions.

## open questions

None for this documentation pass.
