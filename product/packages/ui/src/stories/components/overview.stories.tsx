import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import {
  BoldIcon,
  CalendarIcon,
  CodeIcon,
  DownloadIcon,
  FileIcon,
  FolderIcon,
  HomeIcon,
  InboxIcon,
  InfoIcon,
  PanelLeftIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  SparklesIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
} from 'recharts'
import { toast } from 'sonner'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog'
import { AspectRatio } from '../../components/ui/aspect-ratio'
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../../components/ui/breadcrumb'
import { Button } from '../../components/ui/button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from '../../components/ui/button-group'
import { Calendar } from '../../components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '../../components/ui/carousel'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from '../../components/ui/chart'
import { Checkbox } from '../../components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../../components/ui/collapsible'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList } from '../../components/ui/combobox'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '../../components/ui/command'
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from '../../components/ui/context-menu'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import { DirectionProvider } from '../../components/ui/direction'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '../../components/ui/drawer'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../../components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../../components/ui/empty'
import { Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle } from '../../components/ui/field'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '../../components/ui/hover-card'
import { Input } from '../../components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea } from '../../components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '../../components/ui/input-otp'
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from '../../components/ui/item'
import { Kbd, KbdGroup } from '../../components/ui/kbd'
import { Label } from '../../components/ui/label'
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from '../../components/ui/menubar'
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from '../../components/ui/native-select'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '../../components/ui/navigation-menu'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '../../components/ui/pagination'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../../components/ui/popover'
import { Progress, ProgressLabel, ProgressValue } from '../../components/ui/progress'
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable'
import { ScrollArea } from '../../components/ui/scroll-area'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Separator } from '../../components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarSeparator, SidebarTrigger } from '../../components/ui/sidebar'
import { Skeleton } from '../../components/ui/skeleton'
import { Slider } from '../../components/ui/slider'
import { Toaster } from '../../components/ui/sonner'
import { Spinner } from '../../components/ui/spinner'
import { Switch } from '../../components/ui/switch'
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Textarea } from '../../components/ui/textarea'
import { Toggle } from '../../components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '../../components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip'

const meta = {
  title: 'Components/Overview',
  parameters: {
    layout: 'padded',
  },
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

const chartData = [
  { month: 'Jan', desktop: 86, mobile: 42 },
  { month: 'Feb', desktop: 112, mobile: 63 },
  { month: 'Mar', desktop: 92, mobile: 81 },
  { month: 'Apr', desktop: 138, mobile: 98 },
]

const chartConfig = {
  desktop: { label: 'Desktop', color: 'var(--chart-1)' },
  mobile: { label: 'Mobile', color: 'var(--chart-2)' },
} satisfies ChartConfig

function CatalogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <h2 className="font-heading text-lg font-medium">{title}</h2>
        <Separator className="flex-1" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  )
}

function CatalogCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="min-h-52">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 items-center justify-center p-4">
        {children}
      </CardContent>
    </Card>
  )
}

export const Catalog: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex max-w-7xl flex-col gap-8">
        <CatalogSection title="Actions and status">
          <CatalogCard title="Button">
            <div className="flex flex-wrap justify-center gap-2">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="destructive">
                <Trash2Icon data-icon="inline-start" /> Delete
              </Button>
            </div>
          </CatalogCard>
          <CatalogCard title="ButtonGroup">
            <ButtonGroup>
              <Button variant="outline">Day</Button>
              <Button variant="outline">Week</Button>
              <ButtonGroupSeparator />
              <ButtonGroupText>
                <CalendarIcon /> Today
              </ButtonGroupText>
            </ButtonGroup>
          </CatalogCard>
          <CatalogCard title="Badge / Progress / Spinner">
            <div className="flex w-full max-w-xs flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Stable</Badge>
                <Badge variant="secondary">Beta</Badge>
                <Badge variant="destructive">Alert</Badge>
                <Badge variant="outline">Draft</Badge>
              </div>
              <Progress value={68}>
                <ProgressLabel>Coverage</ProgressLabel>
                <ProgressValue />
              </Progress>
              <Button disabled>
                <Spinner /> Loading
              </Button>
            </div>
          </CatalogCard>
          <CatalogCard title="Toggle">
            <div className="flex flex-col items-center gap-3">
              <Toggle defaultPressed>
                <BoldIcon /> Bold
              </Toggle>
              <ToggleGroup defaultValue={["preview"]}>
                <ToggleGroupItem value="preview">Preview</ToggleGroupItem>
                <ToggleGroupItem value="code">
                  <CodeIcon /> Code
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CatalogCard>
        </CatalogSection>

        <CatalogSection title="Forms">
          <CatalogCard title="Input">
            <FieldGroup className="w-full max-w-xs">
              <Field>
                <FieldLabel htmlFor="catalog-email">Email</FieldLabel>
                <Input id="catalog-email" placeholder="hello@example.com" />
                <FieldDescription>Standard text entry with helper text.</FieldDescription>
              </Field>
            </FieldGroup>
          </CatalogCard>
          <CatalogCard title="InputGroup">
            <InputGroup className="max-w-xs">
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput placeholder="Search components" />
              <InputGroupAddon align="inline-end">
                <InputGroupButton>⌘K</InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
          </CatalogCard>
          <CatalogCard title="Textarea">
            <InputGroup className="max-w-xs">
              <InputGroupTextarea placeholder="Release notes" />
              <InputGroupAddon align="block-end">
                <InputGroupText>Markdown supported</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </CatalogCard>
          <CatalogCard title="Checkbox / Radio / Switch">
            <FieldGroup className="max-w-xs">
              <Field orientation="horizontal">
                <Checkbox defaultChecked />
                <FieldContent>
                  <FieldTitle>Enable sync</FieldTitle>
                  <FieldDescription>Persist changes automatically.</FieldDescription>
                </FieldContent>
              </Field>
              <FieldSet>
                <FieldLegend>Delivery mode</FieldLegend>
                <RadioGroup defaultValue="manual">
                  <Field orientation="horizontal">
                    <RadioGroupItem value="auto" />
                    <FieldLabel>Auto</FieldLabel>
                  </Field>
                  <Field orientation="horizontal">
                    <RadioGroupItem value="manual" />
                    <FieldLabel>Manual</FieldLabel>
                  </Field>
                </RadioGroup>
              </FieldSet>
              <Field orientation="horizontal">
                <Switch defaultChecked />
                <FieldLabel>Public package</FieldLabel>
              </Field>
            </FieldGroup>
          </CatalogCard>
          <CatalogCard title="Select">
            <div className="flex flex-col gap-3">
              <Select defaultValue="react">
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Framework</SelectLabel>
                    <SelectItem value="react">React</SelectItem>
                    <SelectItem value="next">Next.js</SelectItem>
                    <SelectSeparator />
                    <SelectItem value="vite">Vite</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <NativeSelect defaultValue="stable">
                <NativeSelectOption value="stable">Stable</NativeSelectOption>
                <NativeSelectOptGroup label="Preview">
                  <NativeSelectOption value="beta">Beta</NativeSelectOption>
                </NativeSelectOptGroup>
              </NativeSelect>
            </div>
          </CatalogCard>
          <CatalogCard title="Combobox / Field states">
            <div className="flex w-full max-w-xs flex-col gap-4">
              <Combobox defaultValue="react">
                <ComboboxInput placeholder="Search framework" showClear />
                <ComboboxContent>
                  <ComboboxList>
                    <ComboboxEmpty>No framework found.</ComboboxEmpty>
                    <ComboboxGroup>
                      <ComboboxLabel>Framework</ComboboxLabel>
                      <ComboboxItem value="react">React</ComboboxItem>
                      <ComboboxItem value="next">Next.js</ComboboxItem>
                      <ComboboxItem value="vite">Vite</ComboboxItem>
                    </ComboboxGroup>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              <Field data-invalid>
                <FieldLabel htmlFor="catalog-invalid">Package name</FieldLabel>
                <Input id="catalog-invalid" defaultValue="@tenzyu/app-ui" aria-invalid />
                <FieldError>Name is reserved for app-specific UI.</FieldError>
              </Field>
              <FieldSeparator>or</FieldSeparator>
              <Textarea placeholder="Describe the component contract" />
            </div>
          </CatalogCard>
          <CatalogCard title="OTP / Slider">
            <div className="flex w-full max-w-xs flex-col items-center gap-6">
              <InputOTP maxLength={6} defaultValue="123456">
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                </InputOTPGroup>
                <InputOTPSeparator />
                <InputOTPGroup>
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <Slider defaultValue={[35, 72]} />
            </div>
          </CatalogCard>
        </CatalogSection>

        <CatalogSection title="Layout and data">
          <CatalogCard title="Card / Item">
            <ItemGroup className="w-full max-w-sm">
              <Item variant="outline">
                <ItemMedia variant="icon">
                  <FileIcon />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>button.tsx</ItemTitle>
                  <ItemDescription>Primitive with variants and sizes.</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="secondary">UI</Badge>
                </ItemActions>
              </Item>
              <ItemSeparator />
              <Item variant="muted" size="sm">
                <ItemHeader>
                  <ItemTitle>Header</ItemTitle>
                  <Badge>New</Badge>
                </ItemHeader>
                <ItemDescription>Header and footer slots are visible.</ItemDescription>
                <ItemFooter>
                  <span>Updated today</span>
                  <Button size="sm" variant="outline">
                    Open
                  </Button>
                </ItemFooter>
              </Item>
            </ItemGroup>
          </CatalogCard>
          <CatalogCard title="Accordion / Collapsible">
            <div className="w-full max-w-sm">
              <Accordion defaultValue={["one"]}>
                <AccordionItem value="one">
                  <AccordionTrigger>Design tokens</AccordionTrigger>
                  <AccordionContent>
                    Tokens keep examples visually consistent.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <Collapsible defaultOpen>
                <CollapsibleTrigger render={<Button variant="ghost" className="mt-3" />}>
                  Show package notes
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 rounded-lg border p-3 text-sm text-muted-foreground">
                  Stories should cover composition and state.
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CatalogCard>
          <CatalogCard title="Tabs / Kbd">
            <Tabs defaultValue="preview" className="w-full max-w-sm">
              <TabsList>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">Inspectable component state.</TabsContent>
              <TabsContent value="shortcuts">
                <KbdGroup>
                  <Kbd>⌘</Kbd>
                  <Kbd>K</Kbd>
                </KbdGroup>
              </TabsContent>
            </Tabs>
          </CatalogCard>
          <CatalogCard title="Table / Pagination">
            <div className="w-full max-w-md space-y-4">
              <Table>
                <TableCaption>Package release candidates</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>ui</TableCell>
                    <TableCell>
                      <Badge>Ready</Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell>1</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink href="#" isActive>
                      1
                    </PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CatalogCard>
          <CatalogCard title="ScrollArea / Resizable / AspectRatio">
            <div className="flex w-full max-w-sm flex-col gap-3">
              <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg bg-muted">
                <div className="flex size-full items-center justify-center">
                  <SparklesIcon />
                </div>
              </AspectRatio>
              <ScrollArea className="h-20 rounded-lg border p-3">
                <div className="flex flex-col gap-2 text-sm">
                  {Array.from({ length: 8 }, (_, index) => (
                    <span key={index}>Scrollable row {index + 1}</span>
                  ))}
                </div>
              </ScrollArea>
              <ResizablePanelGroup className="h-16 rounded-lg border">
                <ResizablePanel defaultSize={60} className="grid place-items-center">
                  Main
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} className="grid place-items-center">
                  Side
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          </CatalogCard>
          <CatalogCard title="Skeleton / Empty">
            <div className="flex w-full max-w-sm flex-col gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
              <Empty className="border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <InboxIcon />
                  </EmptyMedia>
                  <EmptyTitle>No results</EmptyTitle>
                  <EmptyDescription>Try adjusting your filters.</EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button size="sm">Create item</Button>
                </EmptyContent>
              </Empty>
            </div>
          </CatalogCard>
        </CatalogSection>

        <CatalogSection title="Navigation and overlays">
          <CatalogCard title="Breadcrumb / NavigationMenu">
            <div className="flex flex-col items-center gap-4">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="#">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Components</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger>Docs</NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <div className="grid w-64 gap-1 p-2">
                        <NavigationMenuLink href="#">
                          <HomeIcon /> Introduction
                        </NavigationMenuLink>
                        <NavigationMenuLink href="#">
                          <FolderIcon /> Components
                        </NavigationMenuLink>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </CatalogCard>
          <CatalogCard title="Dropdown / Menubar / ContextMenu">
            <div className="flex flex-col items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" />}>Open menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Account</DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem>
                      <UserIcon /> Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
                    </DropdownMenuItem>
                    <DropdownMenuCheckboxItem checked>Notifications</DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value="comfortable">
                    <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Archive</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>File</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>
                      New <MenubarShortcut>⌘N</MenubarShortcut>
                    </MenubarItem>
                    <MenubarCheckboxItem checked>Autosave</MenubarCheckboxItem>
                    <MenubarSeparator />
                    <MenubarSub>
                      <MenubarSubTrigger>Export</MenubarSubTrigger>
                      <MenubarSubContent>
                        <MenubarItem>JSON</MenubarItem>
                      </MenubarSubContent>
                    </MenubarSub>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>View</MenubarTrigger>
                  <MenubarContent>
                    <MenubarRadioGroup value="preview">
                      <MenubarRadioItem value="preview">Preview</MenubarRadioItem>
                      <MenubarRadioItem value="code">Code</MenubarRadioItem>
                    </MenubarRadioGroup>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
              <ContextMenu>
                <ContextMenuTrigger className="rounded-lg border border-dashed px-4 py-2 text-sm">
                  Right click area
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuLabel>Canvas</ContextMenuLabel>
                  <ContextMenuItem>
                    Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
                  </ContextMenuItem>
                  <ContextMenuCheckboxItem checked>Grid</ContextMenuCheckboxItem>
                  <ContextMenuRadioGroup value="dark">
                    <ContextMenuRadioItem value="dark">Dark</ContextMenuRadioItem>
                  </ContextMenuRadioGroup>
                  <ContextMenuSeparator />
                  <ContextMenuSub>
                    <ContextMenuSubTrigger>More</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                      <ContextMenuItem>Inspect</ContextMenuItem>
                    </ContextMenuSubContent>
                  </ContextMenuSub>
                </ContextMenuContent>
              </ContextMenu>
            </div>
          </CatalogCard>
          <CatalogCard title="Dialog / AlertDialog">
            <div className="flex flex-wrap justify-center gap-2">
              <Dialog>
                <DialogTrigger render={<Button />}>Open dialog</DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish package</DialogTitle>
                    <DialogDescription>Confirm metadata before release.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter showCloseButton>
                    <Button>Publish</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="destructive" />}>Delete</AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <ShieldAlertIcon />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Delete component?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction variant="destructive">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CatalogCard>
          <CatalogCard title="Sheet / Drawer / Popover / HoverCard / Tooltip">
            <div className="flex flex-wrap justify-center gap-2">
              <Sheet>
                <SheetTrigger render={<Button variant="outline" />}>Sheet</SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Settings</SheetTitle>
                    <SheetDescription>Configure the package.</SheetDescription>
                  </SheetHeader>
                  <SheetFooter>
                    <Button>Save</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <Drawer>
                <DrawerTrigger className="inline-flex h-8 items-center justify-center rounded-lg border border-input bg-background px-2.5 text-sm font-medium hover:bg-muted">
                  Drawer
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Mobile action</DrawerTitle>
                    <DrawerDescription>Drawer content for narrow screens.</DrawerDescription>
                  </DrawerHeader>
                  <DrawerFooter>
                    <DrawerClose className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground">
                      Done
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
              <Popover>
                <PopoverTrigger render={<Button variant="outline" />}>Popover</PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Component notes</PopoverTitle>
                    <PopoverDescription>Compact contextual content.</PopoverDescription>
                  </PopoverHeader>
                </PopoverContent>
              </Popover>
              <HoverCard>
                <HoverCardTrigger render={<Button variant="outline" />}>Hover card</HoverCardTrigger>
                <HoverCardContent>
                  <div className="flex gap-3">
                    <Avatar>
                      <AvatarFallback>UI</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">@tenzyu/ui</div>
                      <p className="text-muted-foreground">Shared primitives.</p>
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" />}>Tooltip</TooltipTrigger>
                <TooltipContent>
                  Shortcut <Kbd>⌘K</Kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </CatalogCard>
          <CatalogCard title="Command / Toaster">
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Command className="border shadow-sm">
                <CommandInput placeholder="Search commands" />
                <CommandList>
                  <CommandEmpty>No commands found.</CommandEmpty>
                  <CommandGroup heading="Suggestions">
                    <CommandItem>
                      <SearchIcon /> Search <CommandShortcut>⌘K</CommandShortcut>
                    </CommandItem>
                    <CommandItem>
                      <SettingsIcon /> Settings
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Actions">
                    <CommandItem>
                      <DownloadIcon /> Export
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </Command>
              <Button variant="outline" onClick={() => toast('Storybook toast fired')}>
                Show toast
              </Button>
              <Toaster />
            </div>
          </CatalogCard>
        </CatalogSection>

        <CatalogSection title="Media and application structure">
          <CatalogCard title="Avatar">
            <AvatarGroup>
              <Avatar size="lg">
                <AvatarImage src="https://github.com/shadcn.png" alt="Avatar" />
                <AvatarFallback>SC</AvatarFallback>
                <AvatarBadge />
              </Avatar>
              <Avatar>
                <AvatarFallback>TY</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback>UI</AvatarFallback>
              </Avatar>
              <AvatarGroupCount>+8</AvatarGroupCount>
            </AvatarGroup>
          </CatalogCard>
          <CatalogCard title="Chart">
            <ChartContainer config={chartConfig} className="h-44 w-full">
              <AreaChart data={chartData} accessibilityLayer>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Area dataKey="desktop" type="monotone" fill="var(--color-desktop)" stroke="var(--color-desktop)" />
                <Area dataKey="mobile" type="monotone" fill="var(--color-mobile)" stroke="var(--color-mobile)" />
              </AreaChart>
            </ChartContainer>
          </CatalogCard>
          <CatalogCard title="Calendar / Carousel">
            <div className="flex flex-col items-center gap-4">
              <Calendar mode="single" selected={new Date(2026, 5, 2)} month={new Date(2026, 5, 1)} />
              <Carousel className="w-48">
                <CarouselContent>
                  {[1, 2, 3].map((item) => (
                    <CarouselItem key={item}>
                      <div className="grid h-20 place-items-center rounded-lg bg-muted text-lg font-medium">
                        {item}
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          </CatalogCard>
          <CatalogCard title="Sidebar">
            <SidebarProvider className="min-h-72 overflow-hidden rounded-lg border" defaultOpen>
              <Sidebar collapsible="icon">
                <SidebarHeader>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton size="lg" isActive>
                        <PanelLeftIcon />
                        <span>tenzyu</span>
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
                          <SidebarMenuButton isActive tooltip="Home">
                            <HomeIcon />
                            <span>Home</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton tooltip="Users">
                            <UsersIcon />
                            <span>Users</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge>3</SidebarMenuBadge>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <UserIcon />
                        <span>Account</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </Sidebar>
              <SidebarInset className="min-h-72 p-4">
                <div className="flex items-center gap-2">
                  <SidebarTrigger />
                  <span className="text-sm font-medium">Inset content</span>
                </div>
                <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
                  SidebarProvider, Sidebar, menu, badge, trigger, and inset rendered together.
                </div>
              </SidebarInset>
            </SidebarProvider>
          </CatalogCard>
          <CatalogCard title="DirectionProvider">
            <DirectionProvider direction="rtl">
              <div className="w-full max-w-sm rounded-lg border p-4" dir="rtl">
                <Label>RTL field</Label>
                <Input className="mt-2" defaultValue="واجهة عربية" />
              </div>
            </DirectionProvider>
          </CatalogCard>
          <CatalogCard title="Alert">
            <div className="flex w-full max-w-sm flex-col gap-3">
              <Alert>
                <InfoIcon />
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>Default alert with an action slot.</AlertDescription>
                <AlertAction>
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </AlertAction>
              </Alert>
              <Alert variant="destructive">
                <ShieldAlertIcon />
                <AlertTitle>Destructive</AlertTitle>
                <AlertDescription>Critical state uses destructive tokens.</AlertDescription>
              </Alert>
            </div>
          </CatalogCard>
        </CatalogSection>
      </div>
    </TooltipProvider>
  ),
}

export const ChartsOnly: Story = {
  render: () => (
    <div className="grid max-w-4xl gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Area chart</CardTitle>
          <CardDescription>Tooltip and legend integration.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <AreaChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area dataKey="desktop" type="monotone" fill="var(--color-desktop)" stroke="var(--color-desktop)" />
              <Area dataKey="mobile" type="monotone" fill="var(--color-mobile)" stroke="var(--color-mobile)" />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Bar chart</CardTitle>
          <CardDescription>Shared chart tokens.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-56 w-full">
            <BarChart data={chartData} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
              <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  ),
}
