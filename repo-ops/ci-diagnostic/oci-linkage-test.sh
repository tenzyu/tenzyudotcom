#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/bin"
cat > "$tmp/bin/ldd" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "${LDD_OUTPUT:?}"
exit "${LDD_STATUS:-0}"
SH
chmod +x "$tmp/bin/ldd"
export PATH="$tmp/bin:$PATH"
run() { bash "$root/oci-linkage.sh" fixture "$tmp/linkage.txt"; }
export LDD_OUTPUT='libok.so => /usr/lib/libok.so'
run
export LDD_OUTPUT='libmissing.so => not found'
if run; then echo "Unresolved linkage incorrectly accepted" >&2; exit 1; fi
export LDD_OUTPUT='ldd failed' LDD_STATUS=2
if run; then echo "ldd failure incorrectly accepted" >&2; exit 1; fi
unset LDD_STATUS
cat > "$tmp/bin/grep" <<'SH'
#!/usr/bin/env bash
exit 2
SH
chmod +x "$tmp/bin/grep"
if run; then echo "grep failure incorrectly accepted" >&2; exit 1; fi
echo "Four linkage regression controls passed"
