{
  description = "tenzyu.com monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
    serena.url = "github:oraios/serena";
  };

  outputs = {
    self,
    nixpkgs,
    flake-utils,
    serena,
  }:
    flake-utils.lib.eachDefaultSystem (
      system: let
        pkgs = nixpkgs.legacyPackages.${system};
        lib = pkgs.lib;

        commonPackages = [
          pkgs.biome
          pkgs.bun
          serena.packages.${system}.serena
        ];

        rustPackages = [
          pkgs.rustc
          pkgs.cargo
          pkgs.rustfmt
          pkgs.clippy
        ];

        tauriLinuxPackages =
          lib.optionals pkgs.stdenv.isLinux [
            pkgs.pkg-config
            pkgs.openssl

            pkgs.glib
            pkgs.gtk3
            pkgs.webkitgtk_4_1
            pkgs.libsoup_3

            pkgs.cairo
            pkgs.pango
            pkgs.atk
            pkgs.gdk-pixbuf

            pkgs.dbus
            pkgs.xdotool
          ];
      in {
        devShells.default = pkgs.mkShell {
          packages =
            commonPackages
            ++ rustPackages
            ++ tauriLinuxPackages;

          shellHook = ''
            export BIOME_BIN="${pkgs.biome}/bin/biome"

            if [ -f ./scripts/completion.sh ]; then
              source ./scripts/completion.sh
            fi
          '';
        };
      }
    );
}
