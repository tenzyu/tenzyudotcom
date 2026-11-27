#!/usr/bin/env bash
set -euo pipefail
export NX_DAEMON=false NX_NO_CLOUD=true NX_TUI=false CI=true CARGO_TERM_VERBOSE=true
cd /work
test "$(id -u)" != 0
test "$(git rev-parse HEAD)" = 492f2005b654f005177ce351f6b521eabccc1692
git diff --exit-code
test "$(bun --version)" = 1.4.5
bun install --frozen-lockfile
printf '\n%s\n' "Verify native TypeScript 7 and legacy compiler API coexist"
test "$(bun x --no-install tsc --version)" = 'Version 7.0.2'
node -e 'const ts = require("typescript"); if (typeof ts.readConfigFile !== "function" || typeof ts.createProgram !== "function") throw new Error("TypeScript compatibility API unavailable")'
printf '\n%s\n' "Generate IPC contract and verify TypeScript projection"
mkdir -p product/apps/osu-skin-workbench/src-tauri/target
SKIN_IPC_EXPORT="$PWD/product/apps/osu-skin-workbench/src-tauri/target/wire.generated.ts" cargo test --locked --manifest-path product/apps/osu-skin-workbench/src-tauri/Cargo.toml export_wire_contract
bun nx run osu-skin-core:build
bun x tsc --ignoreConfig --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2022 product/apps/osu-skin-workbench/scripts/wire-contract-check.ts
printf '\n%s\n' "Verify native product and build its distributable"
bun nx run-many -t verify build --projects=skin-workbench --skip-nx-cache
printf '\n%s\n' "Record native WebKit driver version"
command -v WebKitWebDriver
dpkg-query -W webkit2gtk-driver libwebkit2gtk-4.1-0
printf '\n%s\n' "Verify native WebView and real IPC with isolated skin data"
xvfb-run -a dbus-run-session -- python3 product/apps/osu-skin-workbench/tests/tauri-runtime.py
sha256sum product/apps/osu-skin-workbench/src-tauri/target/{wire.generated.ts,release/osu-skin-workbench}
ldd product/apps/osu-skin-workbench/src-tauri/target/release/osu-skin-workbench | tee /tmp/native-linkage.txt
! grep -q 'not found' /tmp/native-linkage.txt
git diff --exit-code
