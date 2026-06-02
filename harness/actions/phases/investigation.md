# Phase: Investigation

Investigation gathers enough evidence to plan safely.

## Output

Record findings in `plan.md` or `worklog.md`.

## Required checks

- affected files
- existing conventions
- current behavior
- suspected root cause, when debugging
- dependency impact
- uncertain areas
- required role knowledge checked
- optional role knowledge deliberately skipped

## Rules

- Inspect before implementing except for trivial edits.
- Prefer precise searches and project facts over broad reading.
- Mark assumptions explicitly.
- Do not invent repository facts.
- Use visible source, Nx project facts, package scripts, and existing docs as evidence.
- Do not load all `harness/knowledge`; follow the assigned role knowledge bundle.
