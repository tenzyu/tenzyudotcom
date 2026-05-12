import type { Meta, StoryObj } from "@storybook/react-vite";
import { PlusIcon, TrashIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { uiVariantPolicy } from "../tokens/variant-policy";
import { StorybookGrid, StorybookPage, StorybookRow, StorybookSection, StorybookTile } from "./_storybook-helpers";

const buttonVariants = ["default", "primary", "secondary", "tertiary", "outline", "soft", "ghost", "link", "destructive"] as const;
const buttonSizes = ["xs", "sm", "default", "lg", "icon-xs", "icon-sm", "icon", "icon-lg"] as const;

const meta = {
  title: "Design System/Components/Actions/Button",
  component: Button,
  parameters: { layout: "fullscreen" },
  argTypes: {
    variant: { control: "select", options: buttonVariants },
    size: { control: "select", options: buttonSizes },
    asChild: { control: "boolean" },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
    asChild: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <StorybookPage title="Button" description="The primary action primitive. Layout around it belongs to the consuming product.">
      <StorybookSection title="Interactive playground">
        <Button {...args} />
      </StorybookSection>
    </StorybookPage>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorybookPage title="Button variants" description="Every variant must map to the shared variant vocabulary.">
      <StorybookSection title="Variant matrix">
        <StorybookGrid min={180}>
          {buttonVariants.map((variant) => (
            <StorybookTile key={variant} label={variant}>
              <Button variant={variant}>{variant}</Button>
            </StorybookTile>
          ))}
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Policy coverage">
        <pre style={{ margin: 0, color: "var(--muted-foreground)", whiteSpace: "pre-wrap" }}>
          {JSON.stringify({ variants: uiVariantPolicy.variants, rules: uiVariantPolicy.rules }, null, 2)}
        </pre>
      </StorybookSection>
    </StorybookPage>
  ),
};

export const Sizes: Story = {
  render: () => (
    <StorybookPage title="Button sizes">
      <StorybookSection title="Text sizes">
        <StorybookRow>
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </StorybookRow>
      </StorybookSection>
      <StorybookSection title="Icon sizes">
        <StorybookRow>
          <Button size="icon-xs" aria-label="Add"><PlusIcon /></Button>
          <Button size="icon-sm" aria-label="Add"><PlusIcon /></Button>
          <Button size="icon" aria-label="Add"><PlusIcon /></Button>
          <Button size="icon-lg" aria-label="Add"><PlusIcon /></Button>
        </StorybookRow>
      </StorybookSection>
    </StorybookPage>
  ),
};

export const States: Story = {
  render: () => (
    <StorybookPage title="Button states">
      <StorybookSection title="Common states">
        <StorybookRow>
          <Button>Enabled</Button>
          <Button disabled>Disabled</Button>
          <Button aria-invalid>Invalid</Button>
          <Button variant="destructive"><TrashIcon /> Delete</Button>
          <Button variant="ghost"><PlusIcon /> With icon</Button>
        </StorybookRow>
      </StorybookSection>
    </StorybookPage>
  ),
};
