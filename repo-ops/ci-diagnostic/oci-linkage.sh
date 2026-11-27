#!/usr/bin/env bash
set -euo pipefail
test "$#" = 2
ldd "$1" | tee "$2"
if grep -q 'not found' "$2"; then
  printf 'Unresolved dynamic linkage: %s\n' "$1" >&2
  exit 1
else
  status=$?
  if [[ "$status" != 1 ]]; then
    printf 'Cannot validate linkage: grep exited %s\n' "$status" >&2
    exit "$status"
  fi
fi
