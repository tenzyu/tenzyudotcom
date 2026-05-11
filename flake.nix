{
  description = "tenzyu.com monorepo";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
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
        shellHooks = import ./nix/shell-hooks.nix { inherit pkgs; };
        packageSets = import ./nix/packages.nix { inherit pkgs serena system; };
        devShells = import ./nix/devshells.nix {
          inherit pkgs packageSets shellHooks;
        };
      in {
        inherit devShells;
      }
    );
}
