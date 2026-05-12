import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchIcon } from "lucide-react";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "../components/ui/carousel";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../components/ui/command";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../components/ui/input-otp";
import { StorybookGrid, StorybookPage, StorybookSection, StorybookTile } from "./_storybook-helpers";

const meta = {
  title: "Design System/Components/Rich/Overview",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {
  render: () => (
    <StorybookPage title="Rich primitives" description="Higher-dependency components remain product-neutral and are covered by the catalog before app integration.">
      <StorybookSection title="Command and OTP">
        <StorybookGrid>
          <StorybookTile label="Command">
            <Command style={{ border: "1px solid var(--border)", minHeight: 220 }}>
              <CommandInput placeholder="Search commands" />
              <CommandList>
                <CommandEmpty>No results</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem><SearchIcon /> Search</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </StorybookTile>
          <StorybookTile label="InputOTP">
            <InputOTP maxLength={4}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Calendar and carousel">
        <StorybookGrid>
          <StorybookTile label="Calendar">
            <Calendar mode="single" selected={new Date(2026, 4, 12)} />
          </StorybookTile>
          <StorybookTile label="Carousel">
            <Carousel style={{ width: "min(360px, 100%)" }}>
              <CarouselContent>
                {[1, 2, 3].map((item) => (
                  <CarouselItem key={item}>
                    <div style={{ display: "grid", placeItems: "center", minHeight: 120, border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                      Slide {item}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </StorybookTile>
        </StorybookGrid>
      </StorybookSection>
      <StorybookSection title="Dependency note">
        <p style={{ margin: 0, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          These components are still React primitives. They must not contain Next.js routing, Tauri commands, or product-specific layout.
        </p>
        <Button variant="soft">Product composes this</Button>
      </StorybookSection>
    </StorybookPage>
  ),
};
