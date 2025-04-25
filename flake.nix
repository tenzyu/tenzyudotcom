{
  description = "tenzyu.com";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/master";
  inputs.flake-utils.url = "github:numtide/flake-utils";

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      devShell = pkgs.mkShell {
        nativeBuildInputs = [ pkgs.zsh ];
        buildInputs = with pkgs; [
          bun
        ];
        shellHook = with pkgs; ''
          if [ -f .env.local ]; then
            set -a
            source .env.local
            set +a
          fi
          
          exec zsh
        '';
      };
    });
}