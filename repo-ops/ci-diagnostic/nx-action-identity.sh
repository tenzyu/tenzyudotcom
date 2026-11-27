#!/usr/bin/env bash
# Scoped diagnostic only: same host and checkout, no remote cache writes.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
out="$RUNNER_TEMP/nx-action-identity"
work="$RUNNER_TEMP/nx-action-worktree"
mkdir -p "$out"
git worktree add --detach "$work" 492f2005b654f005177ce351f6b521eabccc1692
cd "$work"
export NX_DAEMON=false NX_NO_CLOUD=true NX_SKIP_REMOTE_CACHE=true NX_TUI=false NX_LOAD_DOT_ENV_FILES=false CI=true
export TZ=UTC LANG=C.UTF-8
{ node --version; bun --version; uname -a; cat /etc/os-release; nproc; uptime; } > "$out/environment.txt"
printf 'case\tarm\ttarget\tseconds\tcache_log\tstatus\n' > "$out/timings.tsv"
fail=0
clean() {
  git clean -fdx -e node_modules/ > /dev/null
  # tsc -b explicitly writes these beneath ignored node_modules; prevent arm carry-over.
  rm -rf product/packages/ui/node_modules/.tmp product/packages/ui/node_modules/.vite node_modules/.vite node_modules/.cache
}
run_build() {
  local label="$1" arm="$2" target="$3" cache="$4"
  shift 4
  local dir="$out/$label/$arm/$target" result=0 hit=unknown
  mkdir -p "$dir" "$cache"
  # Clear outputs and all ignored compiler state, not dependencies.
  clean
  export NX_CACHE_DIRECTORY="$cache/cache"
  export NX_WORKSPACE_DATA_DIRECTORY="$cache/data"
  export NX_PROJECT_GRAPH_CACHE_DIRECTORY="$cache/graph"
  { git rev-parse HEAD 'HEAD^{tree}'; sha256sum bun.lock nx.json package.json; } > "$dir/revision.txt"
  /usr/bin/time -f '%e' -o "$dir/seconds" bun nx run "$target:build" --outputStyle=static "$@" > "$dir/build.log" 2>&1 || result=$?
  if grep -Ei 'read (the output )?from (the )?cache|local cache|existing outputs match' "$dir/build.log" >/dev/null; then hit=reported; else hit=not-reported; fi
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$label" "$arm" "$target" "$(cat "$dir/seconds")" "$hit" "$result" >> "$out/timings.tsv"
  if [[ "$result" != 0 ]]; then cat "$dir/build.log"; return "$result"; fi
  local dist="product/packages/$target/dist"
  if [[ "$target" == ui ]]; then test -s "$dist/styles.css"; else test -s "$dist/index.js"; test -s "$dist/index.d.ts"; fi
  find "$dist" -type f -print0 | LC_ALL=C sort -z | xargs -0 sha256sum > "$dir/output.sha256"
  # Evidence stays outside scanned source roots.
  if [[ "$target" == ui ]]; then cp "$dist/styles.css" "$dir/styles.css"; fi
  git diff --exit-code
}
compare() {
  local a="$1" b="$2"
  if ! cmp "$a/output.sha256" "$b/output.sha256"; then
    diff -u "$a/output.sha256" "$b/output.sha256" > "$b/difference.txt" || true
    echo "OUTPUT MISMATCH: $a $b"
    fail=1
  fi
}
cases=(
c262f1aa1b182df86df78e4ac3f4c3e6cdfea510
266940216aaac5e43f93280732bc010ffa2e582e
ea396f0368664660ca2bcd421042ce337efb0b63
135053c50dd127136ce6d6f01ff8d5e5b89d952e
45c53f57810220478db5a47f5658ba9f1548cece
c3de6868c166d478b6302a6a83761030e2b42b67
a6ef4b4e72c3d45f9f64c06575a48410d7293f61
387090c7e411709a36b70fc854b84cc599969b07
3e236b77162b4d6be600630371e8a3ff7a0b02e1
625f52e2bfdda7d9632e220198220848719d4dd6
)
# All cases are task-owned diagnostic source-comment candidates, not new feature PRs.
# Keep one checkout path; measure install separately and include in evidence.
for i in "${!cases[@]}"; do
  label="pr-$((165+i))"
  clean
  git checkout --detach "${cases[$i]}"
  mkdir -p "$out/$label"
  /usr/bin/time -f '%e' -o "$out/$label/install.seconds" bun install --frozen-lockfile > "$out/$label/install.log" 2>&1
  git diff --exit-code
  for target in ui osu-skin-core; do
    # Alternate execution order across candidates; cached arm pays first seed.
    if (( i % 2 == 0 )); then
      run_build "$label" cold "$target" "$RUNNER_TEMP/nx-cold-$label-$target" --skip-nx-cache
      run_build "$label" reuse "$target" "$RUNNER_TEMP/nx-reuse-$target"
    else
      run_build "$label" reuse "$target" "$RUNNER_TEMP/nx-reuse-$target"
      run_build "$label" cold "$target" "$RUNNER_TEMP/nx-cold-$label-$target" --skip-nx-cache
    fi
    compare "$out/$label/cold/$target" "$out/$label/reuse/$target"
  done
done
# Negative control at latest develop: does an excluded Storybook source affect UI CSS?
clean
git checkout --detach 492f2005b654f005177ce351f6b521eabccc1692
bun install --frozen-lockfile
story=product/packages/ui/src/generic/components/accordion.stories.tsx
test -f "$story"
git -c user.name=Diagnostic -c user.email=diagnostic@invalid status --porcelain
run_build story-original seed ui "$RUNNER_TEMP/nx-story"
printf '\n// bg-[#13579b] diagnostic hidden Tailwind input\n' >> "$story"
git add "$story"
git -c user.name=Diagnostic -c user.email=diagnostic@invalid commit -m 'test(ci): mutate excluded story source'
run_build story-mutated reuse ui "$RUNNER_TEMP/nx-story"
run_build story-mutated cold ui "$RUNNER_TEMP/nx-story-fresh" --skip-nx-cache
if cmp -s "$out/story-original/seed/ui/output.sha256" "$out/story-mutated/cold/ui/output.sha256"; then
  echo "INCONCLUSIVE: story mutation did not change cold output" | tee "$out/story-verdict.txt"
else
  if cmp -s "$out/story-mutated/reuse/ui/output.sha256" "$out/story-mutated/cold/ui/output.sha256"; then
    echo "PASS: mutation invalidated cache or output equivalence maintained" | tee "$out/story-verdict.txt"
  else
    echo "FAIL: excluded story changes cold output but restored output differs" | tee "$out/story-verdict.txt"
    fail=1
  fi
fi
compare "$out/story-mutated/cold/ui" "$out/story-mutated/reuse/ui"
# Corrected identity hypothesis: use full local source set rather than production exclusions.
clean
git checkout --detach 492f2005b654f005177ce351f6b521eabccc1692
node --input-type=module <<'JS'
import fs from 'node:fs';
const p='product/packages/ui/project.json';
const c=JSON.parse(fs.readFileSync(p,'utf8'));
c.targets.build.inputs=['default','^default'];
fs.writeFileSync(p,JSON.stringify(c,null,2)+'\n');
JS
git add product/packages/ui/project.json
git -c user.name=Diagnostic -c user.email=diagnostic@invalid commit -m 'test(ci): broaden UI build input identity'
run_build corrected-original seed ui "$RUNNER_TEMP/nx-story-corrected"
printf '\n// bg-[#13579b] diagnostic hidden Tailwind input\n' >> "$story"
git add "$story"
git -c user.name=Diagnostic -c user.email=diagnostic@invalid commit -m 'test(ci): mutate excluded story source'
run_build corrected-mutated reuse ui "$RUNNER_TEMP/nx-story-corrected"
run_build corrected-mutated cold ui "$RUNNER_TEMP/nx-story-corrected-fresh" --skip-nx-cache
compare "$out/corrected-mutated/cold/ui" "$out/corrected-mutated/reuse/ui"
# TypeScript is also an acceptance input: tsc -b includes src/**/*.stories.tsx.
# A cached success must not mask a newly introduced type error.
for policy in original corrected; do
  clean
  git checkout --detach 492f2005b654f005177ce351f6b521eabccc1692
  if [[ "$policy" == corrected ]]; then
    node --input-type=module <<'JS'
import fs from 'node:fs';
const p='product/packages/ui/project.json';
const c=JSON.parse(fs.readFileSync(p,'utf8'));
c.targets.build.inputs=['default','^default'];
fs.writeFileSync(p,JSON.stringify(c,null,2)+'\n');
JS
    git add product/packages/ui/project.json
    git -c user.name=Diagnostic -c user.email=diagnostic@invalid commit -m 'test(ci): broaden UI build input identity'
  fi
  run_build "type-$policy" seed ui "$RUNNER_TEMP/nx-type-$policy"
  printf '\nexport const ciDiagnosticTypeMismatch: number = "not-a-number";\n' >> "$story"
  git add "$story"
  git -c user.name=Diagnostic -c user.email=diagnostic@invalid commit -m 'test(ci): inject rejected TypeScript assignment'
  cold_result=0
  reuse_result=0
  run_build "type-$policy" cold ui "$RUNNER_TEMP/nx-type-cold-$policy" --skip-nx-cache || cold_result=$?
  run_build "type-$policy" reuse ui "$RUNNER_TEMP/nx-type-$policy" || reuse_result=$?
  if [[ "$cold_result" == 0 ]] || ! grep -E 'TS2322|not assignable to type' "$out/type-$policy/cold/ui/build.log" >/dev/null; then
    echo "INCONCLUSIVE: cold build did not reproduce the expected type error" | tee "$out/type-$policy/verdict.txt"
    fail=1
  elif [[ "$reuse_result" == 0 ]]; then
    echo "FAIL: cached success masked a real type error" | tee "$out/type-$policy/verdict.txt"
    fail=1
  elif grep -E 'TS2322|not assignable to type' "$out/type-$policy/reuse/ui/build.log" >/dev/null; then
    echo "PASS: type error observed with cache enabled" | tee "$out/type-$policy/verdict.txt"
  else
    echo "INCONCLUSIVE: cached arm failed for another reason" | tee "$out/type-$policy/verdict.txt"
    fail=1
  fi
done
cat "$out/timings.tsv"
exit "$fail"
