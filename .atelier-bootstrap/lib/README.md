# Atelier Bootstrap Shared Library

This directory contains code shared across all four `atelier-*` bootstrap tools.

It does not contain generated output. It only contains deterministic helpers:

```txt
src/paths.ts       # resolve .atelier/v0 paths and components
src/ndjson.ts      # read/write NDJSON streams
src/hash.ts        # sha256 helpers
src/ids.ts         # deterministic id helpers
src/types.ts       # shared Atelier types (SourceRef, AtelierObjectBase, etc.)
src/yaml.ts        # minimal YAML emitter (ProjectBrief)
src/logger.ts      # tiny stderr/stdout logger
src/results.ts     # machine-readable command result helpers
src/json.ts        # safe JSON read/write
```

This directory contains no LLM code and no product code.
