import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { StorybookGrid, StorybookPage, StorybookSection } from "./_storybook-helpers";

const cardVariants = ["default", "soft", "interactive", "quiet", "info", "warning", "danger", "success"] as const;

const meta = {
  title: "Design System/Components/Surfaces/Card",
  component: Card,
  parameters: { layout: "fullscreen" },
  argTypes: {
    variant: { control: "select", options: cardVariants },
  },
  args: {
    variant: "default",
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <StorybookPage title="Card" description="A bounded surface primitive. Product-specific page layout should wrap it, not live inside @tenzyu/ui.">
      <StorybookSection title="Default surface">
        <Card {...args} style={{ maxWidth: 520 }}>
          <CardHeader>
            <CardTitle>Primitive card</CardTitle>
            <CardDescription>Reusable surface with header, content, action, and footer slots.</CardDescription>
            <CardAction><Button size="sm" variant="soft">Action</Button></CardAction>
          </CardHeader>
          <CardContent>Card content accepts arbitrary React children.</CardContent>
          <CardFooter><Button>Confirm</Button></CardFooter>
        </Card>
      </StorybookSection>
    </StorybookPage>
  ),
};

export const Variants: Story = {
  render: () => (
    <StorybookPage title="Card variants">
      <StorybookSection title="Surface variants">
        <StorybookGrid min={260}>
          {cardVariants.map((variant) => (
            <Card key={variant} variant={variant}>
              <CardHeader>
                <CardTitle>{variant}</CardTitle>
                <CardDescription>Surface variant for reusable composition.</CardDescription>
              </CardHeader>
              <CardContent>Use this for product-neutral state presentation.</CardContent>
            </Card>
          ))}
        </StorybookGrid>
      </StorybookSection>
    </StorybookPage>
  ),
};
