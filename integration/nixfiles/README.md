# Castalia nixfiles integration

Castalia does not expose or own Hyprland/Home Manager options. Install the package from the `tenzyudotcom` flake, then bind the command in your existing Hyprland layer.

## Flake input example

```nix
inputs.tenzyudotcom.url = "github:tenzyu/tenzyudotcom";
```

## Home Manager package example

```nix
{ inputs, pkgs, ... }: {
  home.packages = [
    inputs.tenzyudotcom.packages.${pkgs.system}.castalia
  ];
}
```

## Hyprland bind example

Use the same composition style as `rofi -show drun` and `cliphist`:

```nix
(modBind "p" (luaExec "pkill rofi || castalia rofi --replace"))
```

If you prefer uppercase mnemonic:

```nix
(modBind "P" (luaExec "pkill rofi || castalia rofi --replace"))
```
