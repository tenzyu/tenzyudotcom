#!/usr/bin/env bash
set -euo pipefail
cd /workspace
export NX_DAEMON=false NX_NO_CLOUD=true NX_TUI=false
bun install --frozen-lockfile
test "$(bun x --no-install tsc --version)" = 'Version 7.0.2'
node -e 'const ts = require("typescript"); if (typeof ts.readConfigFile !== "function" || typeof ts.createProgram !== "function") throw new Error("TypeScript compatibility API unavailable")'
mkdir -p product/apps/osu-skin-workbench/src-tauri/target
SKIN_IPC_EXPORT="$PWD/product/apps/osu-skin-workbench/src-tauri/target/wire.generated.ts" cargo test --locked --manifest-path product/apps/osu-skin-workbench/src-tauri/Cargo.toml export_wire_contract
bun nx run osu-skin-core:build
bun x tsc --ignoreConfig --noEmit --strict --skipLibCheck --moduleResolution bundler --module esnext --target es2022 product/apps/osu-skin-workbench/scripts/wire-contract-check.ts
bun nx run-many -t verify build --projects=skin-workbench --skip-nx-cache
command -v WebKitWebDriver
dpkg-query -W webkit2gtk-driver libwebkit2gtk-4.1-0
xvfb-run -a dbus-run-session -- python3 product/apps/osu-skin-workbench/tests/tauri-runtime.py
