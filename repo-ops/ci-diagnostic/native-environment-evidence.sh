#!/usr/bin/env bash
set -euo pipefail
phase="$1"
out="$RUNNER_TEMP/environment-evidence/$phase"
mkdir -p "$out"
printf '%s\n' "$ImageOS" "$ImageVersion" "$RUNNER_ARCH" > "$out/image.txt"
{ git rev-parse HEAD 'HEAD^{tree}'; uname -a; cat /etc/os-release; nproc; uptime; } > "$out/runner.txt"
{ rustc -vV; cargo -V; cc --version; ld --version; pkg-config --version; } > "$out/toolchain.txt"
dpkg-query -W -f='${binary:Package}\t${Version}\n' | LC_ALL=C sort > "$out/packages.tsv"
# Collect tool identities without exposing environment variables or credentials.
for tool in rustc cargo cc ld pkg-config; do
  p="$(command -v "$tool")"
  printf '%s\t%s\n' "$tool" "$(readlink -f "$p")"
  sha256sum "$(readlink -f "$p")"
done > "$out/tool-files.txt"
if [[ "$phase" == after ]]; then
  for p in gtk+-3.0 webkit2gtk-4.1 javascriptcoregtk-4.1 glib-2.0 libsoup-3.0 librsvg-2.0 openssl; do
    printf '%s\t' "$p"
    pkg-config --modversion "$p"
    pkg-config --cflags --libs "$p"
  done > "$out/pkg-config.txt"
fi
