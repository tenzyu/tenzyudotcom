import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Components/Disclosure/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StorybookPage title="Disclosure and overlays" description="Composable disclosure primitives. Product-specific modals and workflows belong in apps.">
      <StorybookSection title="Disclosure">
        <Accordion type="single" collapsible style={{ maxWidth: 520 }}>
          <AccordionItem value="one">
            <AccordionTrigger>Primitive accordion</AccordionTrigger>
            <AccordionContent>Accordion content is product-provided.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </StorybookSection>
      <StorybookSection title="Overlay triggers">
        <StorybookGrid>
          <StorybookTile label="Dialog">
            <Dialog>
              <DialogTrigger asChild><Button>Open dialog</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dialog title</DialogTitle>
                  <DialogDescription>Dialog description.</DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </StorybookTile>
          <StorybookTile label="Sheet">
            <Sheet>
              <SheetTrigger asChild><Button variant="outline">Open sheet</Button></SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet title</SheetTitle>
                  <SheetDescription>Sheet description.</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </StorybookTile>
          <StorybookTile label="AlertDialog">
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive">Delete</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm action</AlertDialogTitle>
                  <AlertDialogDescription>This is a destructive confirmation primitive.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </StorybookTile>
          <StorybookTile label="Popover / Tooltip">
            <div style={{ display: "flex", gap: 12 }}>
              <Popover>
                <PopoverTrigger asChild><Button variant="soft">Popover</Button></PopoverTrigger>
                <PopoverContent>Popover content</PopoverContent>
              </Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><Button variant="ghost">Tooltip</Button></TooltipTrigger>
                  <TooltipContent>Tooltip content</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
    </StorybookPage>
  ),
};
