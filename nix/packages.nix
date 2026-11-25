{
  pkgs,
}: let
  lib = pkgs.lib;
  common = [ pkgs.bun pkgs.nodejs_22 ];
  web = [ pkgs.biome ];
  native = [ pkgs.rustc pkgs.cargo pkgs.rustfmt pkgs.clippy ];
  tauriLinux = lib.optionals pkgs.stdenv.isLinux [
    pkgs.pkg-config pkgs.openssl pkgs.glib pkgs.gtk3
    pkgs.webkitgtk_4_1 pkgs.libsoup_3 pkgs.librsvg
    pkgs.cairo pkgs.pango pkgs.atk pkgs.gdk-pixbuf
    pkgs.dbus pkgs.xdotool
  ];
in {
  inherit common web native tauriLinux;
  productWeb = common ++ web;
  browserVerification = common ++ web ++ [ pkgs.chromium ];
  productSkinWorkbench = common ++ web ++ native ++ tauriLinux;
}
