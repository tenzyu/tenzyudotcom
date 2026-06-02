# Workflow: ADR Distillation

ADR distillation turns a material decision into durable memory.

## When To Use

Use this workflow when a task affects:

- architecture boundaries
- package dependency direction
- public APIs
- validation strategy
- long-lived tool or harness structure
- repeated future work

## Required Interview

Ask the owner before writing or changing an ADR when:

- options are materially different
- the tradeoff affects future development cost
- a previous canonical location or policy changes
- the decision removes or deprecates an existing capability

## Output

Create or update an ADR under `harness/knowledge/decisions/adr/`.

## Required Sections

- status
- context
- decision
- alternatives considered
- consequences
- follow-ups

## Rules

- Keep ADRs concise.
- Link to the task folder for detailed evidence.
- Separate confirmed decisions from proposed decisions.
- Do not record unresolved speculation as accepted architecture.
