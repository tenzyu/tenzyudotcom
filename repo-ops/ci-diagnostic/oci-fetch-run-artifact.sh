#!/usr/bin/env bash
set -euo pipefail
# Only public certificates and a synthetic encrypted fixture cross this boundary.
# No image, repository secret, or private key is uploaded.
name="$1"
out="$2"
api="$GITHUB_API_URL/repos/$GITHUB_REPOSITORY/actions/runs/$GITHUB_RUN_ID/artifacts?per_page=100"
deadline=$((SECONDS + 120))
while (( SECONDS < deadline )); do
  json="$(curl --fail --silent --show-error --max-time 15 -H "Authorization: Bearer $GH_TOKEN" -H 'Accept: application/vnd.github+json' "$api")"
  entry="$(jq -ce --arg n "$name" '[.artifacts[] | select(.name == $n and .expired == false)] | if length == 1 then .[0] else empty end' <<< "$json")" || entry=
  if [[ -n "$entry" ]]; then
    id="$(jq -er '.id' <<< "$entry")"
    digest="$(jq -er '.digest | select(test("^sha256:[a-f0-9]{64}$"))' <<< "$entry")"
    [[ "$id" =~ ^[0-9]+$ ]]
    curl --fail --silent --show-error --location --max-time 60 -H "Authorization: Bearer $GH_TOKEN" -H 'Accept: application/vnd.github+json' "$GITHUB_API_URL/repos/$GITHUB_REPOSITORY/actions/artifacts/$id/zip" -o "$out"
    printf '%s  %s\n' "${digest#sha256:}" "$out" | sha256sum -c -
    printf 'Artifact %s / run %s / attempt %s verified\n' "$id" "$GITHUB_RUN_ID" "$GITHUB_RUN_ATTEMPT"
    exit 0
  fi
  sleep 3
done
echo "Timed out waiting for artifact $name" >&2
exit 1
