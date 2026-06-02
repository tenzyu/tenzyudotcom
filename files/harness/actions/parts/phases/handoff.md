# Phase: Handoff

Handoff is the minimum unit of cross-agent continuity.

## Output

Create or update:

```txt
handoff.md
```

Use `../artifacts/templates/handoff.md` when creating a new handoff file.

## Required sections

- task summary
- what changed
- why it changed
- affected files
- validation result
- remaining risks
- follow-up tasks
- memory or knowledge updates made or proposed

## Rules

- Write handoff for the next agent, not for status theater.
- Keep it concise and factual.
- Include skipped checks and known failures.
- Separate completed work from follow-ups.
- Do not copy raw command noise unless it is needed to diagnose a failure.
- Handoff should make the next human or agent cheaper.
