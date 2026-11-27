#!/usr/bin/env bash
# Diagnostic only: fixed task-owned candidates, not an untrusted multi-tenant worker.
set -euo pipefail
out="$RUNNER_TEMP/trusted-cache-cohort"
seed="$RUNNER_TEMP/cohort-dependency-seed"
target=product/apps/osu-skin-workbench/src-tauri/target
manifest=product/apps/osu-skin-workbench/src-tauri/Cargo.toml
lock=product/apps/osu-skin-workbench/src-tauri/Cargo.lock
base=89870871d742adc0e312f8375a5fce1bc344fdba
mkdir -p "$out"
test "$(git rev-parse HEAD)" = "$base"
sha256sum "$manifest" "$lock" bun.lock > "$out/inputs.sha256"
cp "$RUNNER_TEMP/native-cache-inputs.txt" "$out/environment.txt"
printf '%s\n' "${CACHE_HIT:-false}" > "$out/exact-hit.txt"
printf 'candidate\tphase\tseconds\tstatus\n' > "$out/timings.tsv"
measure() {
  local phase="$1" rc=0
  shift
  /usr/bin/time -f '%e' -o "$dir/$phase.seconds" "$@" > "$dir/$phase.log" 2>&1 || rc=$?
  printf '%s\t%s\t%s\t%s\n' "$label" "$phase" "$(cat "$dir/$phase.seconds")" "$rc" >> "$out/timings.tsv"
  if (( rc != 0 )); then tail -n 100 "$dir/$phase.log"; return "$rc"; fi
}
guard() {
  if [[ -d "$target" ]]; then
    local stale
    stale="$(find "$target" \( -name 'osu-skin-workbench*' -o -name 'osu_skin_workbench*' -o -name 'libosu_skin_workbench*' -o -name 'wire.generated.ts' \) -print -quit)"
    test -z "$stale"
  fi
}
gates() {
  measure bun-install bun install --frozen-lockfile
  measure ts-compat bash -euc 'test "$(bun x --no-install tsc --version)" = "Version 7.0.2"; node -e '\''const ts = require("typescript"); if (typeof ts.readConfigFile !== "function" || typeof ts.createProgram !== "function") throw new Error("TypeScript compatibility API unavailable")'\'''
  mkdir -p "$target"
  measure ipc-export env SKIN_IPC_EXPORT="$PWD/$target/wire.generated.ts" cargo test --locked --manifest-path "$manifest" export_wire_contract
  measure core-build bun nx run osu-skin-core:build
  measure ipc-projection bun x tsc --ignoreConfig --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2022 product/apps/osu-skin-workbench/scripts/wire-contract-check.ts
  measure verify-release bun nx run-many -t verify build --projects=skin-workbench --skip-nx-cache
  measure driver bash -euc 'command -v WebKitWebDriver; dpkg-query -W webkit2gtk-driver libwebkit2gtk-4.1-0'
  measure runtime xvfb-run -a dbus-run-session -- python3 product/apps/osu-skin-workbench/tests/tauri-runtime.py
  sha256sum "$target/wire.generated.ts" "$target/release/osu-skin-workbench" > "$dir/output.sha256"
  git diff --exit-code
}
label=seed
dir="$out/$label"
mkdir -p "$dir"
if [[ "${CACHE_HIT:-false}" != true ]]; then
  # Exact miss: never use a partial target. Pay the full trusted-base seed cost.
  test ! -e "$target"
  gates
  measure clean-debug cargo clean --manifest-path "$manifest" -p osu-skin-workbench
  measure clean-release cargo clean --manifest-path "$manifest" -p osu-skin-workbench --release
  rm -rf "$target/debug/incremental" "$target/release/incremental"
  rm -f "$target/wire.generated.ts"
fi
guard
test -d "$target"
measure seed-move mv "$target" "$seed"
du -sb "$seed" > "$out/seed-bytes.txt"
heads=(
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
for i in "${!heads[@]}"; do
  (( i % 3 == COHORT )) || continue
  label="pr-$((165+i))"
  dir="$out/$label"
  mkdir -p "$dir"
  git clean -fdx >/dev/null
  git checkout --detach "${heads[$i]}"
  test "$(git rev-parse HEAD^)" = "$base"
  test "$(git diff --name-only "$base" HEAD | wc -l)" -eq 1
  sha256sum -c "$out/inputs.sha256"
  git rev-parse HEAD 'HEAD^{tree}' > "$dir/revision.txt"
  test ! -e "$target"
  measure seed-copy cp -a --reflink=auto "$seed" "$target"
  guard
  gates
done
cat "$out/timings.tsv"
