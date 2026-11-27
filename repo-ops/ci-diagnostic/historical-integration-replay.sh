#!/usr/bin/env bash
set -euo pipefail
out="$RUNNER_TEMP/integration-replay"
mkdir -p "$out"
base=a7fbf4052d64e38b5a8c6f185437cc9a8c2373a2
tip=0c33f721da4d8cf030aeeab2f97ba92c100d023e
mapfile -t chain < <(git rev-list --first-parent --reverse "$base..$tip")
test "${#chain[@]}" = 10
prev="$base"
printf 'commit\tbase\thead\tactual_tree\treplayed_tree\tresult\n' > "$out/merge-trees.tsv"
mismatch=0
for merge in "${chain[@]}"; do
  read -r actual parent head extra <<< "$(git rev-list --parents -n 1 "$merge")"
  test "$actual" = "$merge" && test "$parent" = "$prev" && test -n "$head" && test -z "${extra:-}"
  expected="$(git rev-parse "$merge^{tree}")"
  if git merge-tree --write-tree "$parent" "$head" > "$out/$merge.merge-tree.log"; then
    got="$(head -n 1 "$out/$merge.merge-tree.log")"
    if [[ "$got" == "$expected" ]]; then status=exact; else status=tree-mismatch; mismatch=1; fi
  else
    got=conflict
    status=requires-resolution
    mismatch=1
  fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$merge" "$parent" "$head" "$expected" "$got" "$status" >> "$out/merge-trees.tsv"
  git merge-base --is-ancestor "$head" "$tip"
  prev="$merge"
done
cat "$out/merge-trees.tsv"
# A conflict is a valid observation, not permission to synthesize a merge.
printf '%s\n' "$mismatch" > "$out/automatic-replay-mismatch.txt"
