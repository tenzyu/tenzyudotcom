import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoldIcon, ItalicIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { ButtonGroup, ButtonGroupText } from "../components/ui/button-group";
import { Toggle } from "../components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { StorybookPage, StorybookRow, StorybookSection } from "./_storybook-helpers";

const meta = {
  title: "Design System/Components/Actions/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StorybookPage title="Action primitives" description="Buttons, toggles, and grouped actions. This category must stay product-neutral.">
      <StorybookSection title="Buttons">
        <StorybookRow>
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </StorybookRow>
      </StorybookSection>
      <StorybookSection title="Groups and toggles">
        <StorybookRow>
          <ButtonGroup>
            <Button variant="outline">One</Button>
            <Button variant="outline">Two</Button>
            <ButtonGroupText>Meta</ButtonGroupText>
          </ButtonGroup>
          <Toggle aria-label="Toggle bold"><BoldIcon /></Toggle>
          <ToggleGroup type="multiple" defaultValue={["bold"]}>
            <ToggleGroupItem value="bold" aria-label="Bold"><BoldIcon /></ToggleGroupItem>
            <ToggleGroupItem value="italic" aria-label="Italic"><ItalicIcon /></ToggleGroupItem>
          </ToggleGroup>
        </StorybookRow>
      </StorybookSection>
    </StorybookPage>
  ),
};
