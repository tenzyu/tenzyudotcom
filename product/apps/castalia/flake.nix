{
  description = "Castalia - local-first invocation layer for personal AI workflows";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-26.05";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
      ];

      forAllSystems =
        f:
        builtins.listToAttrs (
          map
            (system: {
              name = system;
              value = f system;
            })
            systems
        );
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = import nixpkgs {
            inherit system;
          };

          castalia = pkgs.callPackage ./nix/package.nix { };
        in
        {
          default = castalia;
          castalia = castalia;
        }
      );

      apps = forAllSystems (
        system:
        let
          castalia = self.packages.${system}.default;
        in
        {
          default = {
            type = "app";
            program = "${castalia}/bin/castalia";
          };

          castalia = {
            type = "app";
            program = "${castalia}/bin/castalia";
          };
        }
      );

      checks = forAllSystems (
        system:
        {
          castalia = self.packages.${system}.default;
        }
      );
    };
}