import type { Meta, StoryObj } from "@storybook/react-vite";
import { uiVariantPolicy } from "../tokens/variant-policy";
import { StorybookGrid, StorybookNote, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Foundations/Variant Policy",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Policy: Story = {
  render: () => (
    <StorybookPage
      title="Variant policy"
      description="A shared vocabulary for component variants, sizes, density, and accessibility expectations."
    >
      <StorybookSection title="Variants">
        <StorybookGrid min={180}>
          {uiVariantPolicy.variants.map((variant) => (
            <StorybookTile key={variant} label={variant}>
              <code>{variant}</code>
            </StorybookTile>
          ))}
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Sizes">
        <StorybookGrid min={160}>
          {uiVariantPolicy.sizes.map((size) => (
            <StorybookTile key={size} label={size}>
              <code>{size}</code>
            </StorybookTile>
          ))}
        </StorybookGrid>
      </StorybookSection>
      <StorybookNote>
        Destructive is a first-class variant. Product-specific concepts such as route names, workbench screens, or web page sections are not valid design-system variants.
      </StorybookNote>
    </StorybookPage>
  ),
};
