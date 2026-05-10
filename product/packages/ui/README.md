# @tenzyu/ui package boundary

## Import policy

This package intentionally exposes flat component subpaths instead of a root barrel.

```ts
import { Button } from "@tenzyu/ui/button";
import { Card, CardContent } from "@tenzyu/ui/card";
import { Dialog, DialogContent } from "@tenzyu/ui/dialog";
```

Load the shared CSS explicitly:

```ts
import "@tenzyu/ui/styles.css";
```

## Public exports

The package uses a wildcard export boundary:

```json
{
  "./styles.css": "./dist/styles.css",
  "./*": {
    "types": "./dist/*.d.ts",
    "import": "./dist/*.js"
  }
}
```

`@tenzyu/ui/button` resolves to `dist/button.js` and `dist/button.d.ts`.
The source tree does not need flat entry files; the build generates flat public entries from `src/components/ui/*`, `src/components/site/*`, `src/lib/cn.ts`, and `src/tokens/foundations.ts`.

## Non-goals

The package no longer emits or exposes these public entries:

- `@tenzyu/ui`
- `@tenzyu/ui/web`
- `@tenzyu/ui/advanced`
- `@tenzyu/ui/browser`

This keeps the public API explicit at the component level while avoiding an exploding `exports` field.
