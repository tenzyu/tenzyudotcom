import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";
import { uiVariantPolicy } from "../tokens/variant-policy";

const meta = {
  title: "Primitives/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    variant: {
      control: "select",
      options: uiVariantPolicy.variants,
    },
    size: {
      control: "select",
      options: uiVariantPolicy.sizes,
    },
  },
  args: {
    children: "Button",
    variant: "default",
    size: "default",
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Solid: Story = {};

export const Variants: Story = {
  args: {
    variant: "default",
    size: "default"
  },

  render: () => (
    <div className="flex flex-wrap gap-3">
      {uiVariantPolicy.variants.map((variant) => (
        <Button key={variant} variant={variant as React.ComponentProps<typeof Button>["variant"]}>
          {variant}
        </Button>
      ))}
    </div>
  )
};
