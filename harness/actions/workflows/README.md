# Workflow Registry

Use this file as the callable workflow entrypoint.

## Default choice

| Situation | Call |
| --- | --- |
| Non-trivial mutable work | `isolated-run.md` |
| Small scoped docs/config/reference fix | `direct-run.md` |
| Investigation only | `investigation-only.md` |
| Independent review | `review-change.md` |
| Review findings already exist | `review-to-merge.md` |
| Issue or request needs run conversion | `issue-to-run.md` |
| Completed run needs PR packaging | `run-to-pr.md` |
| Durable lesson or decision should be promoted | `promote-knowledge.md` |
| Architecture decision should become ADR | `distill-adr.md` |

## Rule

Workflows are callable.
Parts are not called directly unless a workflow explicitly asks for them.

## Parts

- phases: `../parts/phases/`
- roles: `../parts/roles/`
- artifact templates: `../parts/artifacts/templates/`
