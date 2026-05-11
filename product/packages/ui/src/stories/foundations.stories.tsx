import type { Meta, StoryObj } from "@storybook/react-vite";
import { tenzyuFoundationTokens } from "../tokens/foundations";
import { uiVariantPolicy } from "../tokens/variant-policy";

const meta = {
  title: "Foundations/Policy",
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TokensAndVariants: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6 text-sm">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Color roles</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {tenzyuFoundationTokens.colorRoles.map((role) => (
            <div key={role} className="rounded-md border border-border bg-card p-3 text-card-foreground">
              {role}
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Variant vocabulary</h2>
        <p className="text-muted-foreground">{uiVariantPolicy.variants.join(" / ")}</p>
      </section>
    </div>
  ),
};
