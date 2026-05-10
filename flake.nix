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
          pkgs.bun
        ];

        webPackages = [
          pkgs.biome
        ];

        repoOpsPackages = [
          pkgs.biome
          serena.packages.${system}.serena
        ];

        nativePackages = [
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

        productWebPackages =
          commonPackages
          ++ webPackages;

        productSkinWorkbenchPackages =
          commonPackages
          ++ webPackages
          ++ nativePackages
          ++ tauriLinuxPackages;

        repoOpsShellPackages =
          commonPackages
          ++ repoOpsPackages;

        allPackages =
          commonPackages
          ++ webPackages
          ++ repoOpsPackages
          ++ nativePackages
          ++ tauriLinuxPackages;

        shellHook = ''
          export BIOME_BIN="${pkgs.biome}/bin/biome"

          if [ -f ./repo-ops/shell/completion.sh ]; then
            source ./repo-ops/shell/completion.sh
          elif [ -f ./repo-ops/scripts/completion.sh ]; then
            source ./repo-ops/scripts/completion.sh
          fi
    export XDG_DATA_DIRS="$GSETTINGS_SCHEMAS_PATH" # Needed on Wayland to report the correct display scale
    export LD_LIBRARY_PATH=${pkgs.webkitgtk_4_1}/lib:$LD_LIBRARY_PATH
        '';

        mkDevShell = packages:
          pkgs.mkShell {
            inherit packages shellHook;
          };
      in {
        devShells = {
          default = mkDevShell allPackages;

          web = mkDevShell productWebPackages;

          skin-workbench = pkgs.mkShell {
inherit shellHook;
            packages = productSkinWorkbenchPackages;
  buildInputs = with pkgs; [
    librsvg
    webkitgtk_4_1
  ];
          } ;

          repo-ops = mkDevShell repoOpsShellPackages;

          minimal = mkDevShell commonPackages;
        };
      }
    );
}
