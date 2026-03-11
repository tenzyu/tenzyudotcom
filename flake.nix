{
  description = "tenzyu.com";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/master";
  inputs.flake-utils.url = "github:numtide/flake-utils";
  inputs.serena.url = "github:oraios/serena";

  outputs = { self, nixpkgs, flake-utils, serena }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      inherit (pkgs) importNpmLock;
      nodejs = pkgs.nodejs_24;
      npmRoot = ./node-pkgs;
    in {
      devShells.default = pkgs.mkShell {
        packages = [
          importNpmLock.hooks.linkNodeModulesHook
          pkgs.biome
          pkgs.bun
          serena.packages.${system}.serena
        ];
        npmDeps = importNpmLock.buildNodeModules {
          inherit npmRoot nodejs;
        };
        shellHook = ''
          export BIOME_BIN="${pkgs.biome}/bin/biome"
          source ./scripts/completion.sh
        '';
      };
      
      # NOTE: for codemod
      devShells.codemod = pkgs.mkShell {
        packages = [
          nodejs
        ];
        shellHook = ''
          cd node-pkgs
          echo "Node.js version: $(node -v)
          add:
          npm install -D <package-name>@<version> --package-lock-only
          remove:
          npm uninstall -D <package-name> --package-lock-only
          convert package.json to package-lock.json:
          npm install --package-lock-only"
          '';
        };
    });
}
