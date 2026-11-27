#!/usr/bin/env bash
set -euo pipefail
export PATH="$CI_BUN_BIN:$PATH"
export NX_DAEMON=false NX_NO_CLOUD=true NX_TUI=false NX_LOAD_DOT_ENV_FILES=false CI=true
test "$(bun --version)" = 1.4.5
{ rustc -vV; cargo -V; cc --version; ld --version; pkg-config --version; node --version; bun --version; for tool in rustc cargo cc ld pkg-config node WebKitWebDriver Xvfb dbus-run-session; do command -v "$tool"; done; } > "$EVIDENCE/toolchain.txt"
for pkg in gtk+-3.0 webkit2gtk-4.1 javascriptcoregtk-4.1 glib-2.0 libsoup-3.0 librsvg-2.0 openssl; do pkg-config --modversion "$pkg"; pkg-config --cflags --libs "$pkg"; done > "$EVIDENCE/pkg-config.txt"
# The pinned closure is only a candidate identity, not a claim that nix develop is sandboxed.
# Use no existing Cargo outputs unless their exact producer manifest has been checked.
target=product/apps/osu-skin-workbench/src-tauri/target
manifest=product/apps/osu-skin-workbench/src-tauri/Cargo.toml
lock=product/apps/osu-skin-workbench/src-tauri/Cargo.lock
{ cat "$EVIDENCE/closure.txt" "$EVIDENCE/toolchain.txt" "$EVIDENCE/pkg-config.txt"; printf 'LD_LIBRARY_PATH=%s\nNIX_CFLAGS_COMPILE=%s\nNIX_LDFLAGS=%s\n' "$LD_LIBRARY_PATH" "${NIX_CFLAGS_COMPILE:-}" "${NIX_LDFLAGS:-}"; sha256sum "$(readlink -f "$(command -v bun)")" | cut -d ' ' -f 1; sha256sum "$manifest" "$lock" flake.lock; } > "$EVIDENCE/identity.txt"
sha256sum "$EVIDENCE/identity.txt" > "$EVIDENCE/identity.sha256"
stale_check() {
  if [[ -d "$target" ]]; then
    test -z "$(find "$target" \( -name 'osu-skin-workbench*' -o -name 'osu_skin_workbench*' -o -name 'libosu_skin_workbench*' -o -name 'wire.generated.ts' \) -print -quit)"
  fi
}
if [[ "$MODE" == consumer ]]; then
  cmp "$EVIDENCE/identity.txt" "$SEED/identity.txt"
  (cd "$SEED" && sha256sum -c archive.sha256)
  test ! -e "$target"
  /usr/bin/time -f '%e' -o "$EVIDENCE/restore.seconds" tar --zstd -xf "$SEED/dependencies.tar.zst" -C "$PWD"
  stale_check
fi
/usr/bin/time -f '%e' -o "$EVIDENCE/bun.seconds" bun install --frozen-lockfile
test "$(bun x --no-install tsc --version)" = 'Version 7.0.2'
node -e 'const ts = require("typescript"); if (typeof ts.readConfigFile !== "function" || typeof ts.createProgram !== "function") throw new Error("TypeScript compatibility API unavailable")'
# Fail before expensive compilation if the existing Tauri addon cannot load.
(cd product/apps/osu-skin-workbench; node -e 'require("@tauri-apps/cli")')
mkdir -p "$target"
/usr/bin/time -f '%e' -o "$EVIDENCE/ipc.seconds" env SKIN_IPC_EXPORT="$PWD/$target/wire.generated.ts" cargo test --locked --manifest-path "$manifest" export_wire_contract
bun nx run osu-skin-core:build
bun x tsc --ignoreConfig --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2022 product/apps/osu-skin-workbench/scripts/wire-contract-check.ts
/usr/bin/time -f '%e' -o "$EVIDENCE/native.seconds" bun nx run-many -t verify build --projects=skin-workbench --skip-nx-cache
# Runtime uses the Nix WebKit driver; host Xvfb launcher only if available.
command -v WebKitWebDriver
test -x /usr/bin/xvfb-run
/usr/bin/time -f '%e' -o "$EVIDENCE/runtime.seconds" /usr/bin/xvfb-run -a dbus-run-session -- python3 product/apps/osu-skin-workbench/tests/tauri-runtime.py
sha256sum "$target/wire.generated.ts" "$target/release/osu-skin-workbench" > "$EVIDENCE/output.sha256"
ldd "$target/release/osu-skin-workbench" > "$EVIDENCE/linkage.txt"
git diff --exit-code
if [[ "$MODE" == producer ]]; then
  cargo clean --manifest-path "$manifest" -p osu-skin-workbench
  cargo clean --manifest-path "$manifest" -p osu-skin-workbench --release
  rm -rf "$target/debug/incremental" "$target/release/incremental"
  rm -f "$target/wire.generated.ts"
  stale_check
  mkdir -p "$SEED"
  cp "$EVIDENCE/identity.txt" "$SEED/identity.txt"
  cp "$EVIDENCE/output.sha256" "$SEED/output.sha256"
  /usr/bin/time -f '%e' -o "$EVIDENCE/pack.seconds" tar --use-compress-program='zstd -T2 -3' -cf "$SEED/dependencies.tar.zst" "$target"
  (cd "$SEED" && sha256sum dependencies.tar.zst > archive.sha256)
  du -sb "$SEED" > "$EVIDENCE/seed-bytes.txt"
fi
if [[ "$MODE" == consumer ]]; then
  test "$(head -n1 "$EVIDENCE/output.sha256")" = "$(head -n1 "$SEED/output.sha256")"
fi
