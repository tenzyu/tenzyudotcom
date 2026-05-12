import type { Meta, StoryObj } from "@storybook/react-vite";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../components/ui/empty";
import { Progress } from "../components/ui/progress";
import { Skeleton } from "../components/ui/skeleton";
import { Spinner } from "../components/ui/spinner";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Components/Feedback/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StorybookPage title="Feedback primitives" description="Status, loading, empty, and progress components.">
      <StorybookSection title="Status">
        <StorybookGrid>
          <StorybookTile label="Alert">
            <Alert>
              <AlertTitle>Heads up</AlertTitle>
              <AlertDescription>This is a product-neutral alert primitive.</AlertDescription>
            </Alert>
          </StorybookTile>
          <StorybookTile label="Badges">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Loading and empty">
        <StorybookGrid>
          <StorybookTile label="Progress"><Progress value={62} /></StorybookTile>
          <StorybookTile label="Skeleton"><Skeleton style={{ width: "100%", height: 40 }} /></StorybookTile>
          <StorybookTile label="Spinner"><Spinner /></StorybookTile>
          <StorybookTile label="Empty">
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">∅</EmptyMedia>
                <EmptyTitle>No result</EmptyTitle>
                <EmptyDescription>Empty state copy belongs to the product.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent />
            </Empty>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
    </StorybookPage>
  ),
};
