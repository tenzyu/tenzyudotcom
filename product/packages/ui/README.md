# @tenzyu/ui package boundary

## Import policy

Use flat component subpaths for normal UI:

```ts
import { Button } from "@tenzyu/ui/button";
import { Card, CardContent } from "@tenzyu/ui/card";
import { Dialog, DialogContent } from "@tenzyu/ui/dialog";
```

The root export is intentionally curated and contains only lightweight,
cross-runtime components. Heavy or environment-sensitive components are exposed
through `advanced/*`:

```ts
import { Carousel } from "@tenzyu/ui/advanced/carousel";
import { Toaster } from "@tenzyu/ui/advanced/sonner";
```

Load shared CSS explicitly from applications:

```ts
import "@tenzyu/ui/styles.css";
import "@tenzyu/ui/workbench.css";
```

## Dependency contract

React is a peer dependency. Advanced components use optional peer dependencies
so applications only need to install the heavy packages they import.

The package build keeps those optional peers in `devDependencies` to make
typecheck, package smoke tests, and declaration generation deterministic.
