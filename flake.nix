{
  description = "Tools for editing and extracting osu! skin elements";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = f:
        nixpkgs.lib.genAttrs systems (system:
          f {
            pkgs = import nixpkgs { inherit system; };
          });
    in
    {
      devShells = forAllSystems ({ pkgs }: {
        default = pkgs.mkShell {
          packages = [
            pkgs.bun
            pkgs.unzip
            pkgs.zip
            pkgs.xdg-utils
            pkgs.zenity
            pkgs.kdePackages.kdialog
          ];
        };
      });

      packages = forAllSystems ({ pkgs }: {
        editor = pkgs.writeShellApplication {
          name = "osu-skin-editor";
          runtimeInputs = [ pkgs.bun pkgs.unzip pkgs.zip pkgs.xdg-utils pkgs.zenity pkgs.kdePackages.kdialog ];
          text = ''
            exec bun run ${self}/tools/osu-skin-editor.ts "$@"
          '';
        };

        extract = pkgs.writeShellApplication {
          name = "osu-skin-extract";
          runtimeInputs = [ pkgs.bun pkgs.unzip ];
          text = ''
            exec bun run ${self}/tools/osu-skin-extract.ts "$@"
          '';
        };

        default = self.packages.${pkgs.stdenv.hostPlatform.system}.editor;
      });

      apps = forAllSystems ({ pkgs }: {
        default = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.editor}/bin/osu-skin-editor";
          meta.description = "Open the browser-based osu! skin editor";
        };

        editor = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.editor}/bin/osu-skin-editor";
          meta.description = "Open the browser-based osu! skin editor";
        };

        extract = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.extract}/bin/osu-skin-extract";
          meta.description = "Extract osu! skin elements by game mode";
        };
      });
    };
}
