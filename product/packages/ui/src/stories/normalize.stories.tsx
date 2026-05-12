import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "../components/ui/native-select";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Foundations/Normalize",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BrowserAndWebViewBaseline: Story = {
  render: () => (
    <StorybookPage
      title="Normalize baseline"
      description="This checks cross-browser and WebView baseline behavior. It is allowed in @tenzyu/ui because it is product-neutral."
    >
      <StorybookSection title="Native element baseline">
        <StorybookGrid>
          <StorybookTile label="button">
            <Button>Primitive button</Button>
          </StorybookTile>
          <StorybookTile label="input">
            <Input placeholder="Input text" />
          </StorybookTile>
          <StorybookTile label="textarea">
            <Textarea placeholder="Textarea text" />
          </StorybookTile>
          <StorybookTile label="select">
            <NativeSelect aria-label="Example select" defaultValue="one">
              <NativeSelectOption value="one">One</NativeSelectOption>
              <NativeSelectOption value="two">Two</NativeSelectOption>
            </NativeSelect>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
    </StorybookPage>
  ),
};
