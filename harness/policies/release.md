# Release

Release work is owned by the Release Manager role when a task affects packaging,
deployment, published packages, or user-facing rollout risk.

## Required Release Notes

- linked task ID
- affected product or package
- validation summary
- public API impact
- migration notes
- rollback plan
- known risks

## Rules

- Do not publish or deploy from a task that lacks verification and handoff.
- Separate release follow-ups from implementation completion.
- Document local versus CI differences when known.
