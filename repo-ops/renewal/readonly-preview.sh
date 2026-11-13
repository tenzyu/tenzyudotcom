#!/usr/bin/env bash
set -euo pipefail

unit=tenzyudotcom-readonly-preview.service
case "${1:-}" in
  start)
    root=$(git rev-parse --show-toplevel)
    if systemctl --user is-active --quiet "$unit"; then
      echo 'Preview is already running' >&2
      exit 1
    fi
    if systemctl --user is-failed --quiet "$unit"; then
      systemctl --user reset-failed "$unit"
    fi
    snapshot=$(mktemp -d /tmp/opencode/readonly-preview.XXXXXXXX)
    git -C "$root" archive HEAD | tar -x -C "$snapshot" --exclude='.env' --exclude='.env.*' --exclude='*/.env' --exclude='*/.env.*'
    mkdir -p "$snapshot/home" "$snapshot/tmp" "$snapshot/cache"
    printf '/home/\n/tmp/\n/cache/\n' >> "$snapshot/.nxignore"
    echo "Snapshot: $snapshot"
    systemd-run --user --unit="$unit" --property=WorkingDirectory="$snapshot" \
      --property=MemoryMax=3G --property=MemorySwapMax=0 --property=CPUQuota=200% \
      --property=TasksMax=512 --property=RuntimeMaxSec=1h --property=KillMode=control-group \
      --property=TimeoutStopSec=5s --property=ProtectSystem=strict --property=ProtectHome=yes \
      --property=NoNewPrivileges=yes --property=ReadWritePaths="$snapshot" \
      /run/current-system/sw/bin/env -i "PATH=$PATH" "HOME=$snapshot/home" "TMPDIR=$snapshot/tmp" \
      "XDG_CACHE_HOME=$snapshot/cache" "SSL_CERT_FILE=${SSL_CERT_FILE:-/etc/ssl/certs/ca-certificates.crt}" \
      LANG=C.UTF-8 CI=1 __ETC_PROFILE_DONE=1 NX_DAEMON=false NX_NO_CLOUD=true NEXT_TELEMETRY_DISABLED=1 \
      GITHUB_CONTENT_OWNER=tenzyu GITHUB_CONTENT_REPO=tenzyudotcom-content GITHUB_CONTENT_BRANCH=main GITHUB_CONTENT_ROOT=storage \
      "$(command -v bash)" -c 'set -eu; bun install --frozen-lockfile --no-env-file --backend=copyfile; bun --no-env-file nx run ui:build; export NODE_OPTIONS="--import=$PWD/repo-ops/renewal/readonly-preview-preload.mjs"; exec node repo-ops/renewal/readonly-preview-server.mjs'
    ;;
  stop) systemctl --user stop "$unit" ;;
  status) systemctl --user status "$unit" --no-pager ;;
  *) echo "Usage: nix develop --no-write-lock-file --command bash $0 {start|stop|status}" >&2; exit 2 ;;
esac
