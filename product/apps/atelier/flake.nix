{
  description = "Atelier - local control plane for the repository harness";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-26.05";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
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

          atelier = pkgs.callPackage ./nix/package.nix { };
        in
        {
          default = atelier;
          atelier = atelier;
        }
      );

      apps = forAllSystems (
        system:
        let
          atelier = self.packages.${system}.default;
        in
        {
          default = {
            type = "app";
            program = "${atelier}/bin/atelier";
          };

          atelier = {
            type = "app";
            program = "${atelier}/bin/atelier";
          };
        }
      );

      checks = forAllSystems (
        system:
        {
          atelier = self.packages.${system}.default;
        }
      );
    };
}
