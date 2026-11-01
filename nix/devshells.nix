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
    packages = packageSets.productWeb;
  };

  web = mkDevShell {
    packages = packageSets.productWeb;
  };

  browser-verification = pkgs.mkShell {
    packages = packageSets.browserVerification;
    shellHook =
      shellHooks.common
      + ''
        export PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH="${pkgs.chromium}/bin/chromium"
      '';
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
