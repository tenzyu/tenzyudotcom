# Context: TASK-0020-atelier-m5-m6

## Assignment

- Workflow: `workflow.isolated-run`
- Roles: `role.domain.harness-engineer`, `role.domain.repo-ops-engineer`
- Path: `product/apps/atelier`
- Intent: implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion

## Exact Instructions

- Read only the required context first.
- Load optional context only when the reason matches the concrete task.
- Keep edits scoped to the input path and selected role boundaries unless investigation proves a broader change is required.
- Record verification evidence before claiming completion.
- Update `handoff.md` with changed files, validation, risks, and follow-ups.

## Required Context

- `harness/actions/phases/adr-distillation.md` - workflow phase 'phase.adr-distillation'
- `harness/actions/phases/handoff.md` - workflow phase 'phase.handoff'
- `harness/actions/phases/implementation.md` - workflow phase 'phase.implementation'
- `harness/actions/phases/intake.md` - workflow phase 'phase.intake'
- `harness/actions/phases/investigation.md` - workflow phase 'phase.investigation'
- `harness/actions/phases/knowledge-promotion.md` - workflow phase 'phase.knowledge-promotion'
- `harness/actions/phases/planning.md` - workflow phase 'phase.planning'
- `harness/actions/phases/review.md` - workflow phase 'phase.review'
- `harness/actions/phases/verification.md` - workflow phase 'phase.verification'
- `harness/actions/phases/worktree-isolation.md` - workflow phase 'phase.worktree-isolation'
- `harness/actions/README.md` - required by role 'role.domain.harness-engineer'
- `harness/actions/roles/domain/harness-engineer.md` - requested primary role
- `harness/actions/roles/domain/repo-ops-engineer.md` - requested supporting role
- `harness/actions/roles/README.md` - required by role 'role.domain.harness-engineer'
- `harness/actions/workflows/isolated-run.md` - requested workflow
- `harness/actions/workflows/README.md` - required by role 'role.domain.harness-engineer'
- `harness/canon/classification.md` - required by role 'role.domain.harness-engineer'
- `harness/canon/completion-standard.md` - required by role 'role.domain.harness-engineer'
- `harness/canon/model.md` - required by role 'role.domain.harness-engineer'
- `harness/knowledge/monorepo/nx.md` - pinned by role 'role.domain.repo-ops-engineer'; required by role 'role.domain.repo-ops-engineer'
- `harness/knowledge/repo-map.md` - pinned by role 'role.domain.harness-engineer'; pinned by role 'role.domain.repo-ops-engineer'; required by role 'role.domain.repo-ops-engineer'
- `harness/knowledge/specs/docs/docs-linter-spec.md` - required by role 'role.domain.repo-ops-engineer'
- `harness/policies/context-budget.md` - required by role 'role.domain.harness-engineer'
- `harness/policies/repository.md` - pinned by role 'role.domain.harness-engineer'; pinned by role 'role.domain.repo-ops-engineer'; repository policy; required by role 'role.domain.harness-engineer'; required by role 'role.domain.repo-ops-engineer'
- `harness/policies/tools/git.md` - required by role 'role.domain.repo-ops-engineer'
- `harness/policies/tools/nx.md` - required by role 'role.domain.repo-ops-engineer'
- `harness/policies/tools/tenzyu-linter.md` - required by role 'role.domain.repo-ops-engineer'
- `harness/README.md` - required by role 'role.domain.harness-engineer'

## Optional Context

- `harness/knowledge/decisions/adr/0001-ai-org-standard.md` - optional role knowledge matched intent 'implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion'
- `harness/knowledge/decisions/adr/0004-ai-org-llm-doc-consolidation.md` - optional role knowledge matched intent 'implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion'
- `harness/knowledge/incidents/README.md` - known problem or incident matched intent
- `harness/knowledge/index.md` - role selectors matched tags, knowledge type, and intent
- `harness/knowledge/known-problems/index.md` - known problem or incident matched intent
- `harness/knowledge/known-problems/tech-debt-tracker.md` - known problem or incident matched intent
- `harness/knowledge/product-specs/atelier/README.md` - role selectors matched tags, knowledge type, and intent
- `harness/knowledge/product-specs/atelier/ROADMAP.md` - role selectors matched tags, knowledge type, and intent
- `harness/knowledge/product-specs/others/detect-local-first-and-di-violations.md` - role selectors matched tags, knowledge type, and intent
- `harness/knowledge/product-specs/site/lint-symbol-ownership.md` - role selectors matched tags, knowledge type, and intent
- `harness/knowledge/roadmap.md` - role selectors matched tags, knowledge type, and intent
- `harness/knowledge/rules/intelligence/intelligence-decision-policy.md` - optional role knowledge matched intent 'implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion'
- `harness/knowledge/rules/intelligence/intelligence-harness-memory-model.md` - optional role knowledge matched intent 'implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion'
- `harness/knowledge/specs/docs/docs-agents-md-generator.md` - optional role knowledge matched intent 'implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion'
- `harness/knowledge/specs/docs/docs-rename.md` - optional role knowledge matched intent 'implement Atelier ROADMAP M5 run close and M6 knowledge proposal promotion'

## Skipped Context

- `harness/knowledge/known-problems/` - optional directory or unresolved reference was not expanded
- `harness/legacy/ai-org/` - optional directory or unresolved reference was not expanded
- `harness/observations/audits/` - optional directory or unresolved reference was not expanded
- `harness/runs/completed/TASK-0000-initial-ai-org-standard/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0000-initial-ai-org-standard/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0000-initial-ai-org-standard/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0000-initial-ai-org-standard/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0000-initial-ai-org-standard/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0006-ui-react-storybook/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0006-ui-react-storybook/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0006-ui-react-storybook/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0006-ui-react-storybook/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0007-castalia-monorepo-alignment/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0007-castalia-monorepo-alignment/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0007-castalia-monorepo-alignment/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0007-castalia-monorepo-alignment/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0008-castalia-v0.2-authoring/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0008-castalia-v0.2-authoring/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0008-castalia-v0.2-authoring/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0008-castalia-v0.2-authoring/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0008-castalia-v0.2-authoring/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0009-castalia-v0.2.5-launcher-planning/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0010-castalia-v0.2.5-release/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0011-castalia-v0.2.5-gui-launcher-correction/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0011-castalia-v0.2.5-gui-launcher-correction/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0011-castalia-v0.2.5-gui-launcher-correction/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0011-castalia-v0.2.5-gui-launcher-correction/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0011-castalia-v0.2.5-gui-launcher-correction/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0012-worktree-isolation-workflow/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0012-worktree-isolation-workflow/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0012-worktree-isolation-workflow/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0012-worktree-isolation-workflow/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ai-org-harness-rebuild/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ai-org-harness-rebuild/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ai-org-harness-rebuild/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ai-org-harness-rebuild/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ai-org-harness-rebuild/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-castalia-floating-centered-launcher/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-castalia-floating-centered-launcher/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-castalia-floating-centered-launcher/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-castalia-floating-centered-launcher/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-devshell-env-auto-load/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-devshell-env-auto-load/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-devshell-env-auto-load/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ui-storybook-component-catalog/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ui-storybook-component-catalog/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ui-storybook-component-catalog/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ui-storybook-component-catalog/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0013-ui-storybook-component-catalog/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0014-osu-skin-workbench-spec-doc/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0014-osu-skin-workbench-spec-doc/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0014-osu-skin-workbench-spec-doc/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0015-worktree-path-hardening/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0015-worktree-path-hardening/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0015-worktree-path-hardening/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0015-worktree-path-hardening/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0016-agents-md-refresh/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0016-agents-md-refresh/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0016-agents-md-refresh/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0016-agents-md-refresh/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0017-build-failure-fix/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0017-build-failure-fix/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0017-build-failure-fix/review.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0017-build-failure-fix/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0017-build-failure-fix/worklog.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0018-atelier-m0-m1-app/brief.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0018-atelier-m0-m1-app/handoff.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0018-atelier-m0-m1-app/plan.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0018-atelier-m0-m1-app/review.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0018-atelier-m0-m1-app/verification.md` - completed run history is skipped by default
- `harness/runs/completed/TASK-0018-atelier-m0-m1-app/worklog.md` - completed run history is skipped by default

## Required Artifacts

- `brief.md`
- `context.md`
- `context.manifest.json`
- `worklog.md` for non-trivial implementation notes
- `verification.md`
- `handoff.md`

## Diagnostics

- None

## Closing Command

`atelier run close TASK-0020-atelier-m5-m6`
