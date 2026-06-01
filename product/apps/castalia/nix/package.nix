{
  lib,
  rustPlatform,
  fontconfig,
  makeWrapper,
  libGL,
  libx11,
  libxcb,
  libxcursor,
  libxi,
  libxkbcommon,
  libxrandr,
  noto-fonts-cjk-sans,
  wayland,
  wl-clipboard,
  xclip,
  xsel,
}:

rustPlatform.buildRustPackage {
  pname = "castalia";
  version = "0.2.5";

  src = lib.cleanSource ./..;

  cargoLock = {
    lockFile = ../Cargo.lock;
  };

  nativeBuildInputs = [
    makeWrapper
  ];

  postInstall = ''
    wrapProgram $out/bin/castalia \
      --set CASTALIA_GUI_FONT_PATH ${noto-fonts-cjk-sans}/share/fonts/opentype/noto-cjk/NotoSansCJK-VF.otf.ttc \
      --prefix LD_LIBRARY_PATH : ${
        lib.makeLibraryPath [
          libGL
          libx11
          libxcb
          libxcursor
          libxi
          libxkbcommon
          libxrandr
          wayland
        ]
      } \
      --prefix PATH : ${
        lib.makeBinPath [
          fontconfig
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
