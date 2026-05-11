export const uiVariantPolicy = {
  variants: [
    "default",
    "primary",
    "secondary",
    "tertiary",
    "outline",
    "soft",
    "ghost",
    "link",
    "destructive",
  ],
  sizes: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
  densities: ["comfortable", "compact"],
  rules: {
    defaultVariant: "default",
    defaultSize: "default",
    destructiveIsVariant: true,
    iconOnlyRequiresAccessibleName: true,
    applicationLayoutIsOutOfScope: true,
  },
} as const;

export type UiVariant = (typeof uiVariantPolicy.variants)[number];
export type UiSize = (typeof uiVariantPolicy.sizes)[number];
export type UiDensity = (typeof uiVariantPolicy.densities)[number];
