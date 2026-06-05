<!-- GENERATED FILE. DO NOT EDIT DIRECTLY.
Source of truth: canonical/** and state/**
Regenerate with: bun run render
-->

# Spec Read Plan

Do not read all product specs.

Use:

```bash
bun run query -- --dag <DAG-ID> --format md
bun run packet -- --dag <DAG-ID> --format md
```

Packets include exact source refs and `sed -n '<start>,<end>p' <source_path>` commands.
The full section index is machine data in `canonical/spec-sections.ndjson` (407 sections).
If a packet lacks needed context, report a control-index defect instead of broad spec exploration.
