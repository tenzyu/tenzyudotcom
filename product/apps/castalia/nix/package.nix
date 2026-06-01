{
  lib,
  rustPlatform,
  makeWrapper,
  rofi,
  wl-clipboard,
  xclip,
  xsel,
}:

rustPlatform.buildRustPackage {
  pname = "castalia";
  version = "0.1.0";

  src = lib.cleanSource ./..;

  cargoLock = {
    lockFile = ../Cargo.lock;
  };

  nativeBuildInputs = [
    makeWrapper
  ];

  postInstall = ''
    wrapProgram $out/bin/castalia \
      --prefix PATH : ${
        lib.makeBinPath [
          rofi
          wl-clipboard
          xclip
          xsel
        ]
      }
  '';

  meta = {
    description = "Local-first invocation layer for personal AI workflows";
    homepage = "https://github.com/tenzyu/tenzyudotcom";
    license = lib.licenses.mit;
    mainProgram = "castalia";
    platforms = lib.platforms.linux;
  };
}