# Handoff: TASK-0011

## Task Summary

Created the correction task for Castalia v0.2.5 because TASK-0010 implemented a
TUI, while the owner requested a lightweight Linux GUI launcher similar to
`rofi`.

## What Changed

- Added correction brief.
- Added implementation plan for replacing the TUI launch surface with a GUI.
- Added worklog, verification, and handoff records.

## Why It Changed

The user clarified that the terminal-native launcher is not the intended product.
The correct v0.2.5 release must provide a standalone Linux GUI launcher, not a
terminal application.

## Affected Files

- `harness/ai-org/tasks/TASK-0011-castalia-v0.2.5-gui-launcher-correction/*`

## Validation Result

No source validation was run. This task only adds planning and handoff
documentation.

## Remaining Risks

- TASK-0010 source changes are still present in the working tree.
- A GUI backend has not been implemented yet.
- `egui` is recommended as the first backend to evaluate, but measurement has
  not been performed.

## Follow-Up Tasks

- Implement TASK-0011.
- Decide whether to remove the TUI code entirely or keep it under a non-default
  fallback command.
- Measure the selected GUI backend before claiming v0.2.5 complete.

## Memory Updates Made Or Proposed

No durable memory update was made.
