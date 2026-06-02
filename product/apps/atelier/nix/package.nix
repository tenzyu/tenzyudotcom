{
  lib,
  bun,
  stdenvNoCC,
}:

stdenvNoCC.mkDerivation (finalAttrs: {
  pname = "atelier";
  version = "0.1.0";

  src = lib.cleanSourceWith {
    src = ./..;
    filter =
      name: type:
      let
        baseName = baseNameOf (toString name);
      in
      !(
        type == "directory"
        && (
          baseName == "node_modules"
          || baseName == "dist"
          || baseName == "nix"
        )
      );
  };

  nativeBuildInputs = [
    bun
  ];

  dontConfigure = true;

  buildPhase = ''
    runHook preBuild

    export HOME=$TMPDIR

    bun build \
      --compile \
      --minify \
      ./src/cli.ts \
      --outfile atelier

    runHook postBuild
  '';

  installPhase = ''
    runHook preInstall

    install -Dm755 atelier $out/bin/atelier

    runHook postInstall
  '';

  meta = {
    description = "Local control plane for the repository harness";
    homepage = "https://github.com/tenzyu/tenzyudotcom";
    license = lib.licenses.mit;
    mainProgram = "atelier";
    platforms = lib.platforms.linux ++ lib.platforms.darwin;
  };
})
