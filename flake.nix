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

        packageSets = import ./nix/packages.nix {
          inherit pkgs serena system atelier;
        };

        devShells = import ./nix/devshells.nix {
          inherit pkgs packageSets shellHooks;
        };

        castalia = pkgs.callPackage ./product/apps/castalia/nix/package.nix { };
        atelier = pkgs.callPackage ./product/apps/atelier/nix/package.nix { };
      in
      {
        inherit devShells;

        # Convenience for monorepo developers.
        # External users should consume product/apps/<name> as a subflake.
        packages = {
          inherit castalia atelier;
        };

        apps = {
          castalia = {
            type = "app";
            program = "${castalia}/bin/castalia";
          };
          atelier = {
            type = "app";
            program = "${atelier}/bin/atelier";
          };
        };

        checks = {
          castalia = castalia;
          atelier = atelier;
        };
      }
    );
}