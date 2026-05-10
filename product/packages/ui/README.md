# @tenzyu/ui package boundary

## Import policy

Use the root package for normal application UI:

```ts
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Checkbox,
  NativeSelect,
} from "@tenzyu/ui";
```

The root package is curated and browser-safe. It does not export heavy or environment-sensitive modules.

Use `@tenzyu/ui/web` in Next.js/web-site code when you need the full web bundle:

```ts
import { Toaster, ChartContainer, Calendar } from "@tenzyu/ui/web";
```

Use `@tenzyu/ui/advanced` when you explicitly need heavy components without Next/web helpers:

```ts
import { Command, Combobox, ChartContainer } from "@tenzyu/ui/advanced";
```

Individual subpath imports remain supported for library internals and bundle-critical code, but application code should not need them for normal UI.

## Why root is curated

A package root barrel is convenient, but every re-export becomes part of the module graph. In Tauri/Vite browser code, exporting everything from the root can pull in dependencies such as `recharts`, `react-day-picker`, `cmdk`, `react-hook-form`, `sonner`, or `next-themes`.

Keeping `@tenzyu/ui` curated prevents browser runtime failures such as:

```txt
TypeError: createRequire is not a function
```

## Boundary

Root / browser-safe:

- primitive UI
- common Radix components
- site layout primitives
- `cn`

Advanced:

- chart
- calendar
- command / combobox
- form
- drawer
- carousel
- sidebar
- resizable panels
- navigation menu

Web:

- everything above
- sonner / next-themes-related pieces
- foundations tokens
