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

  # Diagnostic only: extend the existing native shell without changing product shells.
  native-ci-probe = pkgs.mkShell {
    packages = packageSets.productSkinWorkbench ++ [
      pkgs.python3 pkgs.xorg.xorgserver pkgs.xorg.xauth
      pkgs.patchelf pkgs.gsettings-desktop-schemas pkgs.glib-networking pkgs.xz
    ];
    shellHook = shellHooks.common + shellHooks.tauri + ''
      export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [ pkgs.xz ]}:$LD_LIBRARY_PATH"
    '';
  };

  repo-ops = webShell;

  minimal = mkDevShell {
    packages = packageSets.common;
  };
}
