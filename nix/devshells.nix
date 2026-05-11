{
  pkgs,
  packageSets,
  shellHooks,
}: let
  mkDevShell = {
    packages,
    tauri ? false,
  }:
    pkgs.mkShell {
      inherit packages;
      shellHook =
        shellHooks.common
        + pkgs.lib.optionalString tauri shellHooks.tauri;
    };
in {
  default = mkDevShell {
    packages = packageSets.all;
    tauri = true;
  };

  web = mkDevShell {
    packages = packageSets.productWeb;
  };

  skin-workbench = mkDevShell {
    packages = packageSets.productSkinWorkbench;
    tauri = true;
  };

  repo-ops = mkDevShell {
    packages = packageSets.repoOpsShell;
  };

  minimal = mkDevShell {
    packages = packageSets.common;
  };
}
