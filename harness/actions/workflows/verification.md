# Workflow: Verification

Verification proves that the task requirements were checked.

## Output

Create or update `verification.md` in the task folder.

## Required Sections

- commands run
- command results
- files inspected
- visual checks performed, when relevant
- tests added or not added
- skipped checks and justification
- failures and follow-up recommendations

## Rules

- Use Nx through Bun for build, test, lint, typecheck, and verify work.
- Run the narrowest relevant checks first.
- For broad changes, run broad checks when practical.
- If a command fails before testing the change, record the failure exactly.
- Do not claim completion from a proxy signal that does not cover the requirements.
