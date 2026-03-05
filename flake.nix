{
  description = "tenzyu.com";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/master";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
      inherit (pkgs) importNpmLock;
      nodejs = pkgs.nodejs_24;
      npmRoot = ./node-pkgs;
    in {
      devShells.default = pkgs.mkShell {
        packages = [
          importNpmLock.hooks.linkNodeModulesHook
          pkgs.bun
        ];
        npmDeps = importNpmLock.buildNodeModules {
          inherit npmRoot nodejs;
        };
        shellHook = ''
          if [ -f .env.local ]; then
            set -a
            source .env.local
            set +a
          fi
          
          exec zsh
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