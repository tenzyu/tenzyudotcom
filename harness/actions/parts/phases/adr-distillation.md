# Phase: ADR Distillation

ADR distillation turns a material decision into durable architecture knowledge.

This phase absorbs the old one-off `adr-distiller` role responsibilities.

## When to use

Use this phase when a run affects:

- architecture boundaries
- package dependency direction
- public APIs
- validation strategy
- long-lived tool or harness structure
- repeated future work

## Required interview

Ask the owner before writing or changing an ADR when:

- options are materially different
- the tradeoff affects future development cost
- a previous canonical location or policy changes
- the decision removes or deprecates an existing capability

## Output

Create or update an ADR under:

```txt
harness/knowledge/decisions/adr/
```

Update `harness/knowledge/decisions/README.md` or `harness/knowledge/index.md` when routing changes.

## Required sections

- status
- context
- decision
- alternatives considered
- consequences
- follow-ups

## Quality gates

- Preserve context, decision, consequences, and status.
- Keep ADRs short enough to be read in future runs.
- Link to the run folder for detailed evidence.
- Separate confirmed decisions from proposed decisions.
- Do not promote speculation into durable knowledge.
