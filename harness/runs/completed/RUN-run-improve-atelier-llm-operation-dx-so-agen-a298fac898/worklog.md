# Worklog

- Initialized run with corrected workflow/role after the existing adapter command failed without `--role`.
- Added `product/apps/atelier/src/core/llm-protocol.ts` as the shared source for LLM entrypoint commands, registry listing, retry diagnostics, run policies, and next actions.
- Updated CLI help to be validation-free for nested commands and added `workflow list` / `role list` JSON-capable commands.
- Updated context planning to infer roles from input path, keep repository root as `.`, and attach suggestions plus retry commands to missing workflow/role diagnostics.
- Updated run init outputs and manifests with `policy` and `nextActions`.
- Updated MCP with workflow/role list tools and matching run init payload fields.
- Regenerated root adapters and generated Atelier skill from the shared protocol helper, then updated top-level tool entry files to use the exact canonical command.
- Refreshed Atelier indexes after changing generated/source documents.

