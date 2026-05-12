import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../components/ui/input-group";
import { Label } from "../components/ui/label";
import { NativeSelect, NativeSelectOption } from "../components/ui/native-select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { Textarea } from "../components/ui/textarea";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Components/Forms/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StorybookPage title="Form primitives" description="Inputs and controls should expose accessible names and state styles. Form business logic belongs outside @tenzyu/ui.">
      <StorybookSection title="Text entry">
        <StorybookGrid>
          <StorybookTile label="Input">
            <Label htmlFor="story-input">Name</Label>
            <div style={{ height: 8 }} />
            <Input id="story-input" placeholder="tenzyu" />
          </StorybookTile>
          <StorybookTile label="Textarea">
            <Textarea placeholder="Longer text" />
          </StorybookTile>
          <StorybookTile label="InputGroup">
            <InputGroup>
              <InputGroupAddon>@</InputGroupAddon>
              <InputGroupInput placeholder="username" />
            </InputGroup>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Choices">
        <StorybookGrid>
          <StorybookTile label="NativeSelect">
            <NativeSelect aria-label="Native select" defaultValue="one">
              <NativeSelectOption value="one">One</NativeSelectOption>
              <NativeSelectOption value="two">Two</NativeSelectOption>
            </NativeSelect>
          </StorybookTile>
          <StorybookTile label="Select">
            <Select defaultValue="one">
              <SelectTrigger aria-label="Select value"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="one">One</SelectItem>
                <SelectItem value="two">Two</SelectItem>
              </SelectContent>
            </Select>
          </StorybookTile>
          <StorybookTile label="Checkbox / Switch">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Checkbox id="story-checkbox" />
              <Label htmlFor="story-checkbox">Checked option</Label>
              <Switch aria-label="Toggle option" />
            </div>
          </StorybookTile>
          <StorybookTile label="RadioGroup">
            <RadioGroup defaultValue="a">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><RadioGroupItem value="a" id="radio-a" /><Label htmlFor="radio-a">A</Label></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}><RadioGroupItem value="b" id="radio-b" /><Label htmlFor="radio-b">B</Label></div>
            </RadioGroup>
          </StorybookTile>
          <StorybookTile label="Slider">
            <Slider defaultValue={[40]} max={100} />
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
    </StorybookPage>
  ),
};
