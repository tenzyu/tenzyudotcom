import type { Meta, StoryObj } from "@storybook/react-vite";
import { Avatar, AvatarFallback, AvatarGroup } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Kbd, KbdGroup } from "../components/ui/kbd";
import { Separator } from "../components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Components/Data Display/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StorybookPage title="Data display and layout primitives" description="Low-level primitives for displaying structured information.">
      <StorybookSection title="Inline display">
        <StorybookGrid>
          <StorybookTile label="Avatar">
            <AvatarGroup>
              <Avatar><AvatarFallback>T</AvatarFallback></Avatar>
              <Avatar><AvatarFallback>U</AvatarFallback></Avatar>
            </AvatarGroup>
          </StorybookTile>
          <StorybookTile label="Kbd">
            <KbdGroup><Kbd>Ctrl</Kbd><Kbd>K</Kbd></KbdGroup>
          </StorybookTile>
          <StorybookTile label="Separator">
            <div>Before</div><Separator style={{ margin: "12px 0" }} /><div>After</div>
          </StorybookTile>
          <StorybookTile label="Badge"><Badge>Metadata</Badge></StorybookTile>
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Table">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Status</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            <TableRow><TableCell>Primitive</TableCell><TableCell>Stable</TableCell></TableRow>
            <TableRow><TableCell>Layout</TableCell><TableCell>Product-owned</TableCell></TableRow>
          </TableBody>
        </Table>
      </StorybookSection>
    </StorybookPage>
  ),
};
