{ inputs, pkgs, ... }: {
  home.packages = [
    inputs.tenzyudotcom.packages.${pkgs.system}.castalia
  ];
}
