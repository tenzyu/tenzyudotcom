#!/usr/bin/env bash
set -euo pipefail
root="$GITHUB_WORKSPACE"
evidence="$RUNNER_TEMP/oci-evidence"
ctx="$RUNNER_TEMP/oci-context"
mkdir -p "$evidence" "$ctx"
trap 'docker rm -f oci-seed-producer oci-seed-consumer >/dev/null 2>&1 || true' EXIT
date -u +%FT%TZ
df -h
nproc
docker version
# Resolve once, then build from the immutable registry digest. The installed
# packages are captured in the resulting image, not claimed reproducible by tag.
docker pull ubuntu:24.04
base="$(docker image inspect ubuntu:24.04 --format '{{index .RepoDigests 0}}')"
[[ "$base" =~ @sha256:[0-9a-f]{64}$ ]]
printf '%s\n' "$base" > "$evidence/base.txt"
cp -a "$(dirname "$(dirname "$(rustup which rustc)")")" "$ctx/rust"
cp -L "$(command -v bun)" "$ctx/bun"
cp -L "$(command -v node)" "$ctx/node"
cp "$root/repo-ops/ci-diagnostic/oci-seed.Dockerfile" "$ctx/Dockerfile"
{ rustc -vV; cargo -V; node --version; bun --version; sha256sum "$ctx/node" "$ctx/bun"; git -C "$root/producer" rev-parse HEAD 'HEAD^{tree}'; } | tee "$evidence/inputs.txt"
time docker build --build-arg BASE="$base" --build-arg CI_UID="$(id -u)" --build-arg CI_GID="$(id -g)" -t diagnostic-oci-env "$ctx"
rm -rf "$ctx"
env_id="$(docker image inspect diagnostic-oci-env --format '{{.Id}}')"
printf '%s\n' "$env_id" > "$evidence/environment-image-id.txt"
# Never mount host Docker socket, host toolchain, or secrets into the container.
# Retain default seccomp/AppArmor; no privileged mode or WebKit sandbox bypass.
run_container() {
  local name="$1" checkout="$2" image="$3"
  docker run -d --init --name "$name" --shm-size=1g \
    --mount "type=bind,src=$root/$checkout,dst=/work" \
    --mount "type=bind,src=$root/repo-ops/ci-diagnostic,dst=/opt/oci-diagnostic,readonly" \
    "$image" sleep infinity
}
run_container oci-seed-producer producer "$env_id"
docker exec oci-seed-producer bash -euc '
  rustc -vV; cargo -V; node --version; bun --version
  dpkg-query -W -f="\${binary:Package}\\t\${Version}\\n" | LC_ALL=C sort
  test -r /usr/share/dbus-1/session.conf
  dbus-run-session -- true
  xvfb-run -a true
  cd /work/product/apps/osu-skin-workbench
  for tool in /opt/rust/bin/rustc /usr/local/bin/node /usr/local/bin/bun "$(command -v WebKitWebDriver)"; do
    bash /opt/oci-diagnostic/oci-linkage.sh "$tool" /tmp/tool-linkage
  done
' | tee "$evidence/environment.txt"
time docker exec oci-seed-producer bash /opt/oci-diagnostic/oci-native-gates.sh 2>&1 | tee "$evidence/producer.log"
docker exec oci-seed-producer bash -euc '
  p=product/apps/osu-skin-workbench/src-tauri
  sha256sum "$p/target/wire.generated.ts" "$p/target/release/osu-skin-workbench"
' > "$evidence/producer-output.sha256"
time docker exec oci-seed-producer bash -euc '
  p=product/apps/osu-skin-workbench/src-tauri
  cargo clean --manifest-path "$p/Cargo.toml" -p osu-skin-workbench
  cargo clean --manifest-path "$p/Cargo.toml" -p osu-skin-workbench --release
  rm -rf "$p/target/debug/incremental" "$p/target/release/incremental"
  rm -f "$p/target/wire.generated.ts"
  test -z "$(find "$p/target" \( -name "osu-skin-workbench*" -o -name "osu_skin_workbench*" -o -name "libosu_skin_workbench*" -o -name "wire.generated.ts" \) -print -quit)"
  mkdir -p /opt/seed
  mv "$p/target" /opt/seed/target
  git rev-parse HEAD "HEAD^{tree}" > /opt/seed/source-identity.txt
  sha256sum "$p/Cargo.toml" "$p/Cargo.lock" > /opt/seed/lock.sha256
  rm -rf "$HOME/.bun" "$HOME/.cache" "$HOME/.nx"
  du -sb /opt/seed/target "$CARGO_HOME"
'
docker stop oci-seed-producer
time docker commit oci-seed-producer diagnostic-oci-seed
seed_id="$(docker image inspect diagnostic-oci-seed --format '{{.Id}}')"
docker image inspect "$seed_id" --format '{{.Id}} {{.Size}} {{json .RootFS.Layers}}' | tee "$evidence/seed-identity.txt"
# Local-only export: this repository is public. Do not upload the image.
archive="$RUNNER_TEMP/oci-seed.tar.zst"
time (docker save diagnostic-oci-seed | zstd -T2 -3 -o "$archive")
sha256sum "$archive" | tee "$evidence/archive.sha256"
stat -c %s "$archive" | tee "$evidence/archive.bytes"
docker rm oci-seed-producer
docker image rm diagnostic-oci-seed
time (zstd -dc "$archive" | docker load)
test "$(docker image inspect diagnostic-oci-seed --format '{{.Id}}')" = "$seed_id"
rm "$archive"
run_container oci-seed-consumer consumer "$seed_id"
time docker exec oci-seed-consumer bash -euc '
  p=product/apps/osu-skin-workbench/src-tauri
  git rev-parse HEAD "HEAD^{tree}" | cmp - /opt/seed/source-identity.txt
  sha256sum -c /opt/seed/lock.sha256
  test ! -e "$p/target"
  cp -a /opt/seed/target "$p/target"
  test -z "$(find "$p/target" \( -name "osu-skin-workbench*" -o -name "osu_skin_workbench*" -o -name "libosu_skin_workbench*" -o -name "wire.generated.ts" \) -print -quit)"
'
time docker exec oci-seed-consumer bash /opt/oci-diagnostic/oci-native-gates.sh 2>&1 | tee "$evidence/consumer.log"
docker exec oci-seed-consumer bash -euc '
  p=product/apps/osu-skin-workbench/src-tauri
  sha256sum "$p/target/wire.generated.ts" "$p/target/release/osu-skin-workbench"
' > "$evidence/consumer-output.sha256"
cmp "$evidence/producer-output.sha256" "$evidence/consumer-output.sha256"
echo "LOCAL seed smoke passed; no cross-runner or production trust claim"
