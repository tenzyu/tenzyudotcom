#!/usr/bin/env bash
set -euo pipefail
compiler="$1"
shift
# Only registry dependency crates enter the cache; project and path crates always compile.
registry="${CARGO_HOME:-$HOME/.cargo}/registry/src/"
case "${CARGO_MANIFEST_DIR:-}" in
  "$registry"*)
    printf 'registry\n' >> "$SCCACHE_EVIDENCE/wrapper.tsv"
    exec "$SCCACHE_PATH" "$compiler" "$@"
    ;;
  *)
    printf 'direct\n' >> "$SCCACHE_EVIDENCE/wrapper.tsv"
    exec "$compiler" "$@"
    ;;
esac
