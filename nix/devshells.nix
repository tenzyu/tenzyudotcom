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
  webShell = mkDevShell {
    packages = packageSets.productWeb;
  };
in {
  default = webShell;
  web = webShell;

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

  repo-ops = webShell;

  minimal = mkDevShell {
    packages = packageSets.common;
  };
}
