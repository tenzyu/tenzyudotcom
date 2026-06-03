{
  description = "tenzyu.com monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";

    # Monorepo development input.
    # Do not expose the root flake as a lightweight consumer surface.
    serena.url = "github:oraios/serena";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
      serena,
    }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        shellHooks = import ./nix/shell-hooks.nix {
          inherit pkgs;
        };

        atelierLocal = pkgs.writeShellApplication {
          name = "atelier";
          runtimeInputs = [
            pkgs.bun
            pkgs.nodejs_22
          ];
          text = ''
            find_repo_root() {
              dir="''${TENZYUDOTCOM_ROOT:-$PWD}"
              while [ "$dir" != "/" ]; do
                if [ -f "$dir/product/apps/atelier/src/cli.ts" ] && [ -f "$dir/package.json" ]; then
                  printf '%s\n' "$dir"
                  return 0
                fi
                dir="$(dirname "$dir")"
              done
              return 1
            }

            repo_root="$(find_repo_root)" || {
              echo "atelier: could not find tenzyudotcom repository root" >&2
              exit 1
            }

            has_project_root=0
            for arg in "$@"; do
              if [ "$arg" = "--project-root" ]; then
                has_project_root=1
                break
              fi
            done

            if [ "$has_project_root" -eq 1 ]; then
              exec bun "$repo_root/product/apps/atelier/src/cli.ts" "$@"
            fi

            exec bun "$repo_root/product/apps/atelier/src/cli.ts" "$@" --project-root "$repo_root"
          '';
        };

        packageSets = import ./nix/packages.nix {
          inherit pkgs serena system;
          atelier = atelierLocal;
        };

        devShells = import ./nix/devshells.nix {
          inherit pkgs packageSets shellHooks;
        };

        castalia = pkgs.callPackage ./product/apps/castalia/nix/package.nix { };
        atelierRelease = pkgs.callPackage ./product/apps/atelier/nix/package.nix { };
      in
      {
        inherit devShells;

        # Convenience for monorepo developers.
        # External users should consume product/apps/<name> as a subflake.
        packages = {
          inherit castalia;
          atelier = atelierLocal;
          atelier-dev = atelierLocal;
          atelier-release = atelierRelease;
        };

        apps = {
          castalia = {
            type = "app";
            program = "${castalia}/bin/castalia";
          };
          atelier = {
            type = "app";
            program = "${atelierLocal}/bin/atelier";
          };
          atelier-release = {
            type = "app";
            program = "${atelierRelease}/bin/atelier";
          };
        };

        checks = {
          castalia = castalia;
          atelier = atelierLocal;
        };
      }
    );
}
