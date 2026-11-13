import type { Meta, StoryObj } from '@storybook/react-vite'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from './sidebar'
import { Button } from './button'
import { Input } from './input'
import { Avatar, AvatarFallback } from './avatar'
import {
  HomeIcon,
  InboxIcon,
  SettingsIcon,
  UsersIcon,
} from 'lucide-react'

const meta = {
  title: 'Components/Sidebar',
  component: SidebarProvider,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof SidebarProvider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" isActive>
                <Avatar className="size-6">
                  <AvatarFallback>UI</AvatarFallback>
                </Avatar>
                <span>@tenzyu/ui</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton isActive tooltip="Dashboard">
                    <HomeIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Messages">
                    <InboxIcon />
                    <span>Messages</span>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>12</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Users">
                    <UsersIcon />
                    <span>Users</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Preferences">
                    <SettingsIcon />
                    <span>Preferences</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Input placeholder="Search" />
          <Button variant="outline" size="sm">
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h2 className="font-heading text-lg font-medium">Dashboard</h2>
        </div>
        <div className="mt-4 grid gap-3 rounded-lg border p-4 text-sm text-muted-foreground">
          <p>SidebarProvider keeps the layout and trigger state together.</p>
          <p>Collapse and expand the desktop shell to inspect icon mode.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  ),
}
