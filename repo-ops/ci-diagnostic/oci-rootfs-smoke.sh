#!/usr/bin/env bash
set -euo pipefail
root="$GITHUB_WORKSPACE"
evidence="$RUNNER_TEMP/oci-evidence"
ctx="$RUNNER_TEMP/oci-context"
mkdir -p "$evidence" "$ctx"
mounts="$RUNNER_TEMP/oci-rootfs-mounts"
lower="$mounts/lower"
target="$root/consumer/product/apps/osu-skin-workbench/src-tauri/target"
mkdir -p "$lower" "$mounts/upper" "$mounts/work"
cleanup() {
  local status=$?
  trap - EXIT
  set +e
  sudo podman rm -f oci-rootfs-consumer >/dev/null 2>&1
  if mountpoint -q "$target"; then sudo umount "$target" || status=1; fi
  if mountpoint -q "$lower"; then sudo umount "$lower" || status=1; fi
  docker rm -f oci-seed-producer oci-rootfs-preflight >/dev/null 2>&1
  exit "$status"
}
trap cleanup EXIT
# Only signed Ubuntu archive; no host configuration outside this ephemeral VM.
sources=/etc/apt/sources.list.d/ubuntu.sources
test -f "$sources"
grep -q '^Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg$' "$sources"
args=(-o "Dir::Etc::sourcelist=$sources" -o 'Dir::Etc::sourceparts=-')
time sudo apt-get "${args[@]}" update
time sudo apt-get "${args[@]}" install -y --no-install-recommends squashfs-tools-ng
command -v tar2sqfs
sudo podman version
uname -a
findmnt -T "$mounts"
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
# Probe the mount/runtime mechanism before spending a full native compile.
docker create --name oci-rootfs-preflight "$base" /bin/true >/dev/null
test_image="$RUNNER_TEMP/oci-rootfs-preflight.sqfs"
time (docker export oci-rootfs-preflight | tar2sqfs -c zstd "$test_image")
sudo mount -t squashfs -o loop,ro,nodev,nosuid "$test_image" "$lower"
time sudo podman run --rm --network=none --http-proxy=false --user "$(id -u):$(id -g)" --rootfs "$lower:O" /bin/sh -ec 'test "$(id -u)" != 0; touch /tmp/oci-private-write'
test ! -e "$lower/tmp/oci-private-write"
sudo umount "$lower"
docker rm oci-rootfs-preflight
rm "$test_image"
echo "Compressed rootfs + non-root overlay preflight passed"
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
# Use the already-cleaned producer as a read-only filesystem, not a Docker
# archive. No docker commit/save/load and no dependency target copy.
docker stop --time 1 oci-seed-producer
archive="$RUNNER_TEMP/oci-seed.sqfs"
time (docker export oci-seed-producer | tar2sqfs -c zstd "$archive")
sha256sum "$archive" | tee "$evidence/archive.sha256"
stat -c %s "$archive" | tee "$evidence/archive.bytes"
docker rm oci-seed-producer
time sudo mount -t squashfs -o loop,ro,nodev,nosuid "$archive" "$lower"
# The producer and consumer have the same pinned source in this diagnostic.
# The target lowerdir is the immutable seed; upperdir/workdir are consumer-owned.
test ! -e "$target"
mkdir "$target"
time sudo mount -t overlay overlay -o "lowerdir=$lower/opt/seed/target,upperdir=$mounts/upper,workdir=$mounts/work" "$target"
findmnt -T "$target" -o TARGET,FSTYPE,OPTIONS
findmnt -T "$lower" -o TARGET,FSTYPE,OPTIONS
# No container registry push/pull, Docker socket, host network, or security-profile bypass.
# Podman retains the default confinement; app execution is non-root.
time sudo podman run --rm --init --name oci-rootfs-consumer --http-proxy=false \
  --user "$(id -u):$(id -g)" --shm-size=1g --workdir /work \
  --env PATH=/opt/rust/bin:/usr/local/bin:/usr/bin:/bin --env HOME=/home/ci --env CARGO_HOME=/home/ci/.cargo \
  --volume "$root/consumer:/work:rw" \
  --volume "$target:/work/product/apps/osu-skin-workbench/src-tauri/target:rw" \
  --volume "$root/repo-ops/ci-diagnostic:/opt/oci-diagnostic:ro" \
  --rootfs "$lower:O" /bin/bash -euc '
    p=product/apps/osu-skin-workbench/src-tauri
    git rev-parse HEAD "HEAD^{tree}" | cmp - /opt/seed/source-identity.txt
    sha256sum -c /opt/seed/lock.sha256
    test -z "$(find "$p/target" \( -name "osu-skin-workbench*" -o -name "osu_skin_workbench*" -o -name "libosu_skin_workbench*" -o -name "wire.generated.ts" \) -print -quit)"
    test -r /usr/share/dbus-1/session.conf
    dbus-run-session -- true
    bash /opt/oci-diagnostic/oci-native-gates.sh
  ' 2>&1 | tee "$evidence/consumer.log"
(
  cd "$root/consumer"
  p=product/apps/osu-skin-workbench/src-tauri
  sha256sum "$p/target/wire.generated.ts" "$p/target/release/osu-skin-workbench"
) > "$evidence/consumer-output.sha256"
cmp "$evidence/producer-output.sha256" "$evidence/consumer-output.sha256"
test ! -e "$lower/opt/seed/target/wire.generated.ts"
test ! -e "$lower/opt/seed/target/release/osu-skin-workbench"
du -sb "$mounts/upper" | tee "$evidence/consumer-upper.bytes"
sudo umount "$target"
sudo umount "$lower"
sha256sum -c "$evidence/archive.sha256"
echo "LOCAL mounted seed passed; no cross-runner or production trust claim"
