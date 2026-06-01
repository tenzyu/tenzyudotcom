{ pkgs }:

pkgs.rustPlatform.buildRustPackage {
  pname = "castalia";
  version = "0.1.0";

  src = ../product/apps/castalia;
  cargoLock.lockFile = ../product/apps/castalia/Cargo.lock;

  nativeBuildInputs = [ pkgs.makeWrapper ];

  postInstall = ''
    wrapProgram "$out/bin/castalia" \
      --prefix PATH : ${pkgs.lib.makeBinPath [
        pkgs.rofi
        pkgs.wl-clipboard
        pkgs.xclip
        pkgs.xsel
        pkgs.libnotify
      ]}
  '';

  meta = {
    description = "Local-first prompt and skill launcher for Linux";
    mainProgram = "castalia";
    platforms = pkgs.lib.platforms.linux;
  };
}
