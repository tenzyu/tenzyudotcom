# Put this next to your existing Hyprland bind helpers.
# Castalia owns prompt invocation. Hyprland owns keybinds.

(modBind "p" (luaExec "pkill rofi || castalia rofi --replace"))
