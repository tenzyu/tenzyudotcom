import type { Meta, StoryObj } from "@storybook/react-vite";
import { tenzyuFoundationTokens } from "../tokens/foundations";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookSwatch } from "./_storybook-helpers";

const meta = {
  title: "Design System/Foundations/Tokens",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const ColorRoles: Story = {
  render: () => (
    <StorybookPage
      title="Design tokens"
      description="Role-based tokens that must work in web apps and WebView-based desktop apps. Product layout must not be encoded here."
    >
      <StorybookSection title="Color roles" description="Components should consume roles, not product-specific color names.">
        <StorybookGrid min={240}>
          {tenzyuFoundationTokens.colorRoles.map((role) => (
            <StorybookSwatch key={role} name={role} value={`var(--${role})`} />
          ))}
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Typography and layout policy">
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          {JSON.stringify(
            {
              contrast: tenzyuFoundationTokens.contrastPolicy,
              typography: tenzyuFoundationTokens.typographyPolicy,
              layout: tenzyuFoundationTokens.layoutPolicy,
            },
            null,
            2,
          )}
        </pre>
      </StorybookSection>
    </StorybookPage>
  ),
};
