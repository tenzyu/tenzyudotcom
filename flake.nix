{
  description = "Tools for editing and extracting osu! skin elements";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      source = builtins.path {
        path = ./.;
        name = "osu-skin-tools-source";
        filter = path: type:
          let
            base = baseNameOf path;
            rel = nixpkgs.lib.removePrefix ((toString ./.) + "/") (toString path);
          in
            !(base == ".git"
              || base == "result"
              || nixpkgs.lib.hasPrefix "skins/" rel
              || nixpkgs.lib.hasPrefix "exports/" rel
              || nixpkgs.lib.hasPrefix "skin-editor-projects/" rel
              || nixpkgs.lib.hasPrefix "node_modules/" rel);
      };
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
            pkgs.nodejs_22
            pkgs.unzip
            pkgs.zip
            pkgs.xdg-utils
            pkgs.zenity
            pkgs.kdePackages.kdialog
          ];
        };
      });

      packages = forAllSystems ({ pkgs }: {
        frontend = pkgs.buildNpmPackage {
          pname = "osu-skin-editor-frontend";
          version = "0.1.0";
          src = source;
          npmDepsHash = "sha256-xe7onR737CobBQ84FapCJHw/Ea9PDJGX9H+CUEjLyv0=";
          npmBuildScript = "build:editor";
          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r src/editor-dist/. $out/
            runHook postInstall
          '';
        };

        editor = pkgs.writeShellApplication {
          name = "osu-skin-editor";
          runtimeInputs = [ pkgs.bun pkgs.unzip pkgs.zip pkgs.xdg-utils pkgs.zenity pkgs.kdePackages.kdialog ];
          text = ''
            export OSU_SKIN_EDITOR_STATIC_ROOT="${self.packages.${pkgs.stdenv.hostPlatform.system}.frontend}"
            exec bun run ${self}/src/osu-skin-editor.ts "$@"
          '';
        };

        extract = pkgs.writeShellApplication {
          name = "osu-skin-extract";
          runtimeInputs = [ pkgs.bun pkgs.unzip ];
          text = ''
            exec bun run ${self}/src/osu-skin-extract.ts "$@"
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
