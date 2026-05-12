# @tenzyu/ui

`@tenzyu/ui` is the product-neutral React primitive UI package for tenzyudotcom.

It owns:

- design tokens and CSS variables
- browser/WebView normalization
- primitive React UI components
- Storybook catalog for visual, accessibility, and variant review
- variant vocabulary and component quality policy

It does not own:

- web page layout
- workbench application layout
- route-specific classes
- app-specific animation
- one-off product overrides
- Next.js, Tauri, or domain-specific behavior

Product-specific layout belongs to the product that uses it. Site layout belongs under `product/apps/web`. Workbench runtime layout belongs under `product/apps/osu-skin-workbench`.

## Storybook

```sh
bun nx run ui:storybook
bun nx run ui:build-storybook
bun nx run ui:check-storybook-catalog
```

The Storybook taxonomy is intentionally stable:

- `Design System/Foundations/*`
- `Design System/Components/Actions/*`
- `Design System/Components/Surfaces/*`
- `Design System/Components/Forms/*`
- `Design System/Components/Feedback/*`
- `Design System/Components/Navigation/*`
- `Design System/Components/Disclosure/*`
- `Design System/Components/Data Display/*`
- `Design System/Components/Rich/*`

Every file in `src/components/ui/*.tsx` must be registered in `src/stories/_catalog.ts`.
