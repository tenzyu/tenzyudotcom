# AGENTS: Repo Map

This file is a routing map, not an encyclopedia.
Read the smallest next document that can unblock the task.

## Rules: Granular Architecture
- [Rules Index](./design-docs/AGENTS.md): searchable rule collection

## Product Specs
- `/docs/product-specs/**/*.md`: route-specific or product-area-specific requirements

## Plans And Workflows
- `/docs/exec-plans/active/*.md`: active plans, follow-ups, and execution-ready work in one place
- `/docs/exec-plans/completed/*.md`: completed work logs
- `/docs/exec-plans/archive/*.md`: archived older plans
- `/docs/exec-plans/tech-debt-tracker.md`: known gaps that are not durable rules yet
- [plan-authoring-workflow](./workflows/plan-authoring-workflow.md): how to draft a plan
- [exec-plan-contract](./workflows/exec-plan-contract.md): minimum contract for execution-ready plans
- [agent-orchestration-workflow](./workflows/agent-orchestration-workflow.md): delegate, review, integrate, archive

## External References
- `/docs/references/*.md`: external tools and environments
- [github-pr-workflow](./references/github-pr-workflow.md): GitHub CLI and PR flow
- [error-analysis](./references/error-analysis.md): runtime error investigation flow
- [ui-verification](./references/ui-verification.md): browser automation and UI checks

## GeneratedReports
- `/docs/.ai-reports/*.md`: opt-in reports and audits, not default reading

## Routing
- New task: Start here, then open one relevant granular rule or spec.
- Unsure about file placement: Check Foundations section.
- Need process guidance: Check Security & Safety or matching workflow.

## Skills
- `.agents/skills/*/SKILL.md`: repo-local skill instructions such as Intlayer and shadcn
