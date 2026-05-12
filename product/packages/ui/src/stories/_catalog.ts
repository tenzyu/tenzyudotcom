export const storybookCatalog = {
  foundations: ["tokens", "normalize", "variant-policy"],
  components: {
    actions: ["button", "button-group", "toggle", "toggle-group"],
    surfaces: ["card", "item", "empty"],
    forms: [
      "input",
      "textarea",
      "label",
      "field",
      "form",
      "select",
      "native-select",
      "checkbox",
      "radio-group",
      "switch",
      "slider",
      "input-group",
      "input-otp",
    ],
    feedback: ["alert", "badge", "progress", "skeleton", "spinner", "sonner"],
    navigation: ["breadcrumb", "pagination", "tabs", "navigation-menu"],
    disclosure: [
      "accordion",
      "collapsible",
      "dialog",
      "alert-dialog",
      "sheet",
      "drawer",
      "popover",
      "hover-card",
      "tooltip",
      "dropdown-menu",
      "context-menu",
      "menubar",
      "command",
    ],
    dataDisplay: [
      "aspect-ratio",
      "avatar",
      "calendar",
      "carousel",
      "chart",
      "combobox",
      "kbd",
      "resizable",
      "scroll-area",
      "separator",
      "table",
    ],
  },
} as const;

export const catalogedComponentFiles = Object.values(storybookCatalog.components)
  .flat()
  .toSorted();

export const storybookCategoryRules = {
  packageName: "@tenzyu/ui",
  allowedTitlePrefix: "Design System/",
  forbiddenProductTerms: [
    "web page",
    "workbench layout",
    "osu skin",
    "route-specific",
    "tenzyu.com page",
  ],
  contract: [
    "React primitive components only",
    "No Next.js, Tauri, product route, or domain behavior",
    "Product layouts belong to product apps",
    "Storybook must expose component states, variants, sizes, and accessibility expectations",
  ],
} as const;
