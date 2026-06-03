{
  lib,
  stdenvNoCC,
  fetchurl,
}:

let
  packageJson = builtins.fromJSON (builtins.readFile ../package.json);

  # atelier is distributed as a pre-built single-file binary produced by
  # .github/workflows/release-atelier.yml. We never run `bun install` inside
  # the Nix sandbox so this works for downstream consumers with sandbox=true.
  #
  # Publish through .github/workflows/release-atelier.yml with
  # workflow_dispatch. The workflow builds all platform archives, computes the
  # SRI hashes below, updates this file, tags that commit, and uploads the same
  # archive bytes to GitHub Releases. Do not publish by pushing a tag that
  # rebuilds the binary independently; `bun build --compile` is not guaranteed
  # to produce byte-identical output across runs.
  version = packageJson.version;
  releaseTag = "atelier-v${version}";
  baseUrl = "https://github.com/tenzyu/tenzyudotcom/releases/download/${releaseTag}";

  archiveLabels = {
    "x86_64-linux" = "linux-x64";
    "aarch64-linux" = "linux-arm64";
    "x86_64-darwin" = "darwin-x64";
    "aarch64-darwin" = "darwin-arm64";
  };

  releaseHashes = {
    "linux-x64" = lib.fakeHash;
    "linux-arm64" = lib.fakeHash;
    "darwin-x64" = lib.fakeHash;
    "darwin-arm64" = lib.fakeHash;
  };

  hostSystem = stdenvNoCC.hostPlatform.system;
  archiveLabel =
    archiveLabels.${hostSystem}
      or (throw "atelier: unsupported system ${hostSystem}");
in
stdenvNoCC.mkDerivation {
  pname = "atelier";
  inherit version;

  src = fetchurl {
    url = "${baseUrl}/atelier-${archiveLabel}.tar.gz";
    hash = releaseHashes.${archiveLabel};
  };

  sourceRoot = ".";

  dontConfigure = true;
  dontBuild = true;

  installPhase = ''
    runHook preInstall
    install -Dm755 atelier $out/bin/atelier
    runHook postInstall
  '';

  passthru = {
    inherit archiveLabel releaseHashes releaseTag;
  };

  meta = {
    description = "Local control plane for the repository harness";
    homepage = "https://github.com/tenzyu/tenzyudotcom";
    license = lib.licenses.mit;
    mainProgram = "atelier";
    platforms = lib.platforms.linux ++ lib.platforms.darwin;
  };
}
