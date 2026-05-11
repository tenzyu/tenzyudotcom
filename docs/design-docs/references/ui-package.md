# @tenzyu/ui package boundary

`@tenzyu/ui` must remain a product-neutral React design-system package.

## Owns

- primitive React UI components
- design tokens
- cross-browser and WebView normalization
- variant policy
- Storybook catalog

## Does not own

- web page layout
- workbench layout
- route-specific styles
- product-specific animation
- one-off overrides
- Next.js adapters
- Tauri adapters
- osu! domain concepts

## Import direction

Apps may import `@tenzyu/ui` primitives. `@tenzyu/ui` must not import from apps.

Site layout belongs to `product/apps/web/src/components/site`.
Workbench layout belongs to `product/apps/osu-skin-workbench/src/workbench.css` and workbench feature components.
