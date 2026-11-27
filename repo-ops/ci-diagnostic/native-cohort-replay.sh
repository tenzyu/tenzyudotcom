#!/usr/bin/env bash
# Trusted fixed diagnostic trees only; never a shared untrusted PR execution worker.
set -euo pipefail
out="$RUNNER_TEMP/native-cohort-evidence"
work="$RUNNER_TEMP/native-cohort-checkout"
seed="$RUNNER_TEMP/native-cohort-seed"
mkdir -p "$out" "$seed"
export NX_DAEMON=false NX_NO_CLOUD=true NX_TUI=false NX_LOAD_DOT_ENV_FILES=false
export CARGO_HOME="$RUNNER_TEMP/native-cohort-cargo"
export RUSTUP_HOME="${RUSTUP_HOME:-$HOME/.rustup}"
root="$(git rev-parse --show-toplevel)"
git worktree add --detach "$work" 89870871d742adc0e312f8375a5fce1bc344fdba
cd "$work"
target=product/apps/osu-skin-workbench/src-tauri/target
manifest=product/apps/osu-skin-workbench/src-tauri/Cargo.toml
lock=product/apps/osu-skin-workbench/src-tauri/Cargo.lock
{ printf '%s\n' "$ImageOS" "$ImageVersion" "$RUNNER_ARCH"; rustc -vV; cargo -V; cc --version; ld --version; pkg-config --version; dpkg-query -W -f='${binary:Package}\t${Version}\n' | LC_ALL=C sort; } > "$out/environment.txt"
sha256sum "$out/environment.txt"
sha256sum "$manifest" "$lock" > "$out/cargo-inputs.sha256"
df -h > "$out/disk-start.txt"
printf 'case\tphase\tseconds\n' > "$out/timings.tsv"
measure() {
  local phase="$1"
  shift
  local t="$dir/$phase.seconds" rc=0
  /usr/bin/time -f '%e' -o "$t" "$@" > "$dir/$phase.log" 2>&1 || rc=$?
  printf '%s\t%s\t%s\n' "$label" "$phase" "$(tail -n1 "$t")" >> "$out/timings.tsv"
  if [[ "$rc" != 0 ]]; then tail -n 100 "$dir/$phase.log"; return "$rc"; fi
}
fresh() {
  git clean -fdx >/dev/null
  rm -rf "$CARGO_HOME"
  mkdir -p "$CARGO_HOME"
  git checkout --detach "$1"
  sha256sum -c "$out/cargo-inputs.sha256"
  git rev-parse HEAD 'HEAD^{tree}' > "$dir/revision.txt"
}
guard_target() {
  local stale
  if [[ -d "$target" ]]; then
    stale="$(find "$target" \( -name 'osu-skin-workbench*' -o -name 'osu_skin_workbench*' -o -name 'libosu_skin_workbench*' -o -name 'wire.generated.ts' \) -print -quit)"
    test -z "$stale" || { echo "Workspace artifact present: $stale"; return 1; }
  fi
}
gates() {
  measure bun-install bun install --frozen-lockfile
  measure ts-compat bash -euc 'test "$(bun x --no-install tsc --version)" = "Version 7.0.2"; node -e '\''const ts = require("typescript"); if (typeof ts.readConfigFile !== "function" || typeof ts.createProgram !== "function") throw new Error("TypeScript compatibility API unavailable")'\'''
  mkdir -p "$target"
  measure ipc-export env SKIN_IPC_EXPORT="$PWD/$target/wire.generated.ts" cargo test --locked --manifest-path product/apps/osu-skin-workbench/src-tauri/Cargo.toml export_wire_contract
  measure core-build bun nx run osu-skin-core:build
  measure ipc-projection bun x tsc --ignoreConfig --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2022 product/apps/osu-skin-workbench/scripts/wire-contract-check.ts
  measure native-verify-release bun nx run-many -t verify build --projects=skin-workbench --skip-nx-cache
  measure driver bash -euc 'command -v WebKitWebDriver; dpkg-query -W webkit2gtk-driver libwebkit2gtk-4.1-0'
  measure runtime xvfb-run -a dbus-run-session -- python3 product/apps/osu-skin-workbench/tests/tauri-runtime.py
  sha256sum "$target/wire.generated.ts" "$target/release/osu-skin-workbench" > "$dir/output.sha256"
  git diff --exit-code
}
prepare() {
  label="$1"
  dir="$out/$label"
  mkdir -p "$dir"
  fresh "$2"
  guard_target
}
# A real cold candidate on the same physical environment. All sources removed afterward.
prepare cold-a c262f1aa1b182df86df78e4ac3f4c3e6cdfea510
gates
# Seed is generated from a fixed trusted develop commit, not either candidate.
prepare producer 89870871d742adc0e312f8375a5fce1bc344fdba
gates
measure clean-debug cargo clean --manifest-path "$manifest" -p osu-skin-workbench
measure clean-release cargo clean --manifest-path "$manifest" -p osu-skin-workbench --release
rm -rf "$target/debug/incremental" "$target/release/incremental"
rm -f "$target/wire.generated.ts"
guard_target
measure seed-copy bash -euc 'cp -a --reflink=auto "$1" "$2/target"; cp -a --reflink=auto "$CARGO_HOME/registry" "$2/registry"' _ "$target" "$seed"
du -sb "$seed/target" "$seed/registry" > "$out/seed-bytes.txt"
# Consumers never write back. Each gets the same seed at the same absolute paths.
for spec in 'warm-a c262f1aa1b182df86df78e4ac3f4c3e6cdfea510' 'warm-b c3de6868c166d478b6302a6a83761030e2b42b67'; do
  read -r name sha <<< "$spec"
  prepare "$name" "$sha"
  git diff --name-only 89870871d742adc0e312f8375a5fce1bc344fdba HEAD > "$dir/diff.txt"
  # Only fixed task-owned comment-only candidates, identical manifest/lock and build configuration.
  case "$name" in
    warm-a) test "$(cat "$dir/diff.txt")" = product/apps/web/src/features/editor-auth/login-rate-limit.ts ;;
    warm-b) test "$(cat "$dir/diff.txt")" = product/apps/osu-skin-workbench/src-tauri/src/infra/archive.rs ;;
  esac
  measure seed-restore bash -euc 'mkdir -p "$(dirname "$1")"; cp -a --reflink=auto "$2/target" "$1"; cp -a --reflink=auto "$2/registry" "$CARGO_HOME/registry"' _ "$target" "$seed"
  guard_target
  gates
done
# No reuse of acceptance outcomes; compare generated IPC contract, not native executable bytes.
test "$(head -n1 "$out/cold-a/output.sha256")" = "$(head -n1 "$out/warm-a/output.sha256")"
cat "$out/timings.tsv"
cat "$out/seed-bytes.txt"
df -h > "$out/disk-end.txt"
