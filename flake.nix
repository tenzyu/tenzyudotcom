{
  description = "Lazer-first osu! skin editor";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];

      source = builtins.path {
        path = ./.;
        name = "osu-skin-editor-source";
        filter = path: type:
          let
            base = baseNameOf path;
            rel = nixpkgs.lib.removePrefix ((toString ./.) + "/") (toString path);
          in
            !(base == ".git"
              || base == "result"
              || base == ".next"
              || base == "out"
              || nixpkgs.lib.hasPrefix "skins/" rel
              || nixpkgs.lib.hasPrefix "exports/" rel
              || nixpkgs.lib.hasPrefix "skin-editor-projects/" rel
              || nixpkgs.lib.hasPrefix "node_modules/" rel
              || nixpkgs.lib.hasPrefix ".next/" rel
              || nixpkgs.lib.hasPrefix "out/" rel);
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

            # .osk import/export
            pkgs.unzip
            pkgs.zip
          ];

          shellHook = ''
            echo "osu-skin-editor dev shell"
            echo "  bun install"
            echo "  bun run dev"
            echo "  bun run check"
          '';
        };
      });

      packages = forAllSystems ({ pkgs }: {
        editor = pkgs.writeShellApplication {
          name = "osu-skin-editor";

          runtimeInputs = [
            pkgs.bun
            pkgs.nodejs_22
            pkgs.unzip
            pkgs.zip
          ];

          text = ''
            if [ ! -f package.json ]; then
              echo "error: run this command from the osu-skin-editor repository root" >&2
              exit 1
            fi

            exec bun run dev "$@"
          '';
        };

        check = pkgs.writeShellApplication {
          name = "osu-skin-editor-check";

          runtimeInputs = [
            pkgs.bun
            pkgs.nodejs_22
            pkgs.unzip
            pkgs.zip
          ];

          text = ''
            if [ ! -f package.json ]; then
              echo "error: run this command from the osu-skin-editor repository root" >&2
              exit 1
            fi

            exec bun run check "$@"
          '';
        };

        default = self.packages.${pkgs.stdenv.hostPlatform.system}.editor;
      });

      apps = forAllSystems ({ pkgs }: {
        default = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.editor}/bin/osu-skin-editor";
          meta.description = "Start the Next.js osu! skin editor";
        };

        editor = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.editor}/bin/osu-skin-editor";
          meta.description = "Start the Next.js osu! skin editor";
        };

        check = {
          type = "app";
          program = "${self.packages.${pkgs.stdenv.hostPlatform.system}.check}/bin/osu-skin-editor-check";
          meta.description = "Run tests, typecheck, and Next.js build";
        };
      });
    };
}