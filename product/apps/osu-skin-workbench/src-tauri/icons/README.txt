# osu-skin-workbench icon pack

Recommended immediate fix for Tauri:

1. Create the directory:
   `product/apps/osu-skin-workbench/src-tauri/icons/`

2. Copy `icon.png` into it.

If you want, you can also use the additional sizes:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `512x512.png`
- `icon.ico`

Minimal `tauri.conf.json` bundle section:

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": ["icons/icon.png"]
}
```
