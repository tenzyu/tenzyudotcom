# @tenzyu/ui

`@tenzyu/ui` is the cross-runtime React UI package for tenzyudotcom.

It owns:

- design tokens and CSS variables
- browser/WebView normalization
- primitive React UI components
- Storybook catalog for primitive UI quality checks
- variant vocabulary and accessibility-oriented component policy

It does not own:

- web page layout
- workbench application layout
- route-specific classes
- app-specific animation
- one-off product overrides
- Next.js, Tauri, or domain-specific behavior

Product-specific layout belongs to the product that uses it. For example, site layout components live under `product/apps/web/src/components/site`, and workbench runtime layout CSS lives under `product/apps/osu-skin-workbench/src/workbench.css`.
