import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

const meta = {
  title: "Primitives/Card",
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Primitive card</CardTitle>
        <CardDescription>Product-specific layout should live outside @tenzyu/ui.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="soft">Action</Button>
      </CardContent>
    </Card>
  ),
};
