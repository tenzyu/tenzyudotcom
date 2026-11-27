#!/usr/bin/env bash
# Behavioral cache regression: run only in a disposable checkout.
set -euo pipefail
export NX_DAEMON=false NX_NO_CLOUD=true NX_SKIP_REMOTE_CACHE=true NX_TUI=false NX_LOAD_DOT_ENV_FILES=false
root="$(git rev-parse --show-toplevel)"
out="$RUNNER_TEMP/nx-cache-proof/ui-input-contract"
work="$RUNNER_TEMP/ui-input-contract-worktree"
mkdir -p "$out"
git worktree add --detach "$work" HEAD
trap 'git -C "$root" worktree remove --force "$work"' EXIT
cd "$work"
bun install --frozen-lockfile
story=product/packages/ui/src/generic/components/accordion.stories.tsx
dist=product/packages/ui/dist
commit_fixture() {
  git add "$story"
  git -c user.name=Diagnostic -c user.email=diagnostic@invalid commit -m "$1"
}
run_build() {
  local label="$1" cache="$2"
  shift 2
  local dir="$out/$label"
  mkdir -p "$dir"
  git clean -fdx -e node_modules/ >/dev/null
  rm -rf product/packages/ui/node_modules/.tmp product/packages/ui/node_modules/.vite node_modules/.vite node_modules/.cache
  export NX_CACHE_DIRECTORY="$RUNNER_TEMP/ui-input-cache/$cache"
  export NX_WORKSPACE_DATA_DIRECTORY="$RUNNER_TEMP/ui-input-data/$cache"
  bun nx run ui:build --outputStyle=static "$@" > "$dir/build.log" 2>&1 || {
    cat "$dir/build.log"
    return 1
  }
  test -s "$dist/styles.css" || return 1
  find "$dist" -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > "$dir/output.sha256"
}
original="$(git rev-parse HEAD)"
run_build css-seed css
printf '\n// bg-[#13579b] diagnostic hidden Tailwind input\n' >> "$story"
commit_fixture 'test(ci): add Tailwind source input'
run_build css-reuse css
run_build css-cold css-cold --skip-nx-cache
if cmp -s "$out/css-seed/output.sha256" "$out/css-cold/output.sha256"; then
  echo 'Negative control failed: mutation must change a fresh output'
  exit 1
fi
cmp "$out/css-reuse/output.sha256" "$out/css-cold/output.sha256"
echo 'PASS: source mutation yields fresh-equivalent output' > "$out/css-reuse/verdict.txt"
git checkout --detach "$original"
run_build type-seed type
printf '\nexport const ciDiagnosticTypeMismatch: number = "not-a-number";\n' >> "$story"
commit_fixture 'test(ci): inject rejected TypeScript assignment'
for mode in cold reuse; do
  args=()
  cache=type
  if [[ "$mode" == cold ]]; then args=(--skip-nx-cache); cache=type-cold; fi
  if run_build "type-$mode" "$cache" "${args[@]}"; then
    echo "Type error incorrectly accepted by $mode"
    exit 1
  fi
  grep -E 'TS2322|not assignable to type' "$out/type-$mode/build.log"
done
echo 'PASS: cache cannot mask the injected type error' > "$out/type-reuse/verdict.txt"
