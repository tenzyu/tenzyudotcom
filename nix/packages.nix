{
  pkgs,
  serena,
  system,
  atelier,
}: let
  lib = pkgs.lib;

  common = [
    pkgs.bun
    pkgs.nodejs_22
  ];

  web = [
    pkgs.biome
  ];

  repoOps = [
    pkgs.biome
    serena.packages.${system}.serena
  ];

  native = [
    pkgs.rustc
    pkgs.cargo
    pkgs.rustfmt
    pkgs.clippy
  ];

  tauriLinux =
    lib.optionals pkgs.stdenv.isLinux [
      pkgs.pkg-config
      pkgs.openssl

      pkgs.glib
      pkgs.gtk3
      pkgs.webkitgtk_4_1
      pkgs.libsoup_3
      pkgs.librsvg

      pkgs.cairo
      pkgs.pango
      pkgs.atk
      pkgs.gdk-pixbuf

      pkgs.dbus
      pkgs.xdotool
    ];
in {
  inherit common web repoOps native tauriLinux;

  productWeb = common ++ web;
  productSkinWorkbench = common ++ web ++ native ++ tauriLinux;
  # `atelier` is the local source runner supplied by the root flake. Keep it
  # out of the release binary path so `nix develop` works before a release tag
  # has published fixed-output artifacts.
  repoOpsShell = common ++ repoOps ++ [atelier];
  all = common ++ web ++ repoOps ++ native ++ tauriLinux ++ [atelier];
}
