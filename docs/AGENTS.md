# AGENTS: Repo Map

This file is a routing map, not an encyclopedia.
Read the smallest next document that can unblock the task.

## Rules: Granular Architecture
- [Rules Index](./design-docs/AGENTS.md): searchable rule collection

### Foundations
- [Rules: Vertical Slices (VSA)](./design-docs/rules/vsa-vertical-slices.md)
- [Rules: 6-Layer Ownership](./design-docs/rules/ownership-model-layers.md)
- [Rules: Local-first](./design-docs/rules/local-first-promote-later.md)
- [Rules: Directory Strictness](./design-docs/rules/directory-strictness.md)
- [Rules: Path & Feature Semantics](./design-docs/rules/path-feature-semantics.md)
- [Rules: Dependency Inversion](./design-docs/rules/dependency-inversion.md)

### Security & Safety
- [Rules: Security Env Parsing](./design-docs/rules/security-env-parsing.md)
- [Rules: Security Outbound Boundary](./design-docs/rules/security-outbound-boundary.md)
- [Rules: Structural & Mutation Guards](./design-docs/rules/guard-structural-mutation.md)
- [Rules: Verification Guard](./design-docs/rules/guard-verification.md)

### Implementation & Quality
- [Rules: No Dirty Code](./design-docs/rules/no-dirty-code.md)
- [Rules: Contract & Boundary Validation](./design-docs/rules/contract-boundary-validation.md)
- [Rules: Composition Patterns](./design-docs/rules/composition-patterns.md)
- [Rules: Performance Optimization](./design-docs/rules/performance-optimization.md)
- [Rules: Bundle & Discovery Hygiene](./design-docs/rules/tool-bundle-hygiene.md)
- [Rules: Separation of Logic/Presentation](./design-docs/rules/logic-presentation-separation.md)

### UI & UX
- [Rules: Token-first Styling](./design-docs/rules/design-token-first.md)
- [Rules: Accessibility by Default](./design-docs/rules/design-a11y-default.md)

### Product & Intelligence
- [Rules: Product Core Values](./design-docs/rules/product-core-values.md)
- [Rules: i18n Meaning vs Data](./design-docs/rules/i18n-meaning-vs-data.md)
- [Rules: Harness Engineering](./design-docs/rules/harness-engineering.md)
- [Rules: Memory Layers](./design-docs/rules/memory-layers.md)
- [Rules: Decision Priority](./design-docs/rules/decision-priority-order.md)
- [Rules: Editorial Role Separation](./design-docs/rules/editorial-role-separation.md)
- [Rules: Target over Current](./design-docs/rules/normative-target-over-current.md)

### Reliability
- [Rules: Reliability Fault Tolerance](./design-docs/rules/reliability-fault-tolerance.md)
- [Rules: Reliability Metadata Safety](./design-docs/rules/reliability-metadata-safety.md)

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

## Generated Reports
- `/docs/.ai-reports/*.md`: opt-in reports and audits, not default reading

## Routing
- New task: Start here, then open one relevant granular rule or spec.
- Unsure about file placement: Check Foundations section.
- Need process guidance: Check Security & Safety or matching workflow.

## Skills
- `.agents/skills/*/SKILL.md`: repo-local skill instructions such as Intlayer and shadcn
