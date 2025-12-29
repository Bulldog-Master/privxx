/**
 * Component Documentation Registry
 * 
 * Central registry for all component documentation.
 */

import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LockedState } from "@/components/shared";
import { Shield, Lock, Loader2, Bell, Plus, Search, Mail, Eye, EyeOff, User, Settings, CreditCard, HelpCircle, Info, ChevronDown, AlertCircle, AlertTriangle, CheckCircle2, Terminal, Volume2 } from "lucide-react";
import { toast } from "sonner";

// Types
export interface PropDoc {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
}

export interface ExampleDoc {
  id: string;
  title: string;
  description?: string;
  code: string;
  language?: string;
  preview?: ReactNode;
}

export interface ComponentDoc {
  id: string;
  name: string;
  description: string;
  category: "UI" | "Shared" | "Identity" | "Connection" | "Layout";
  importPath?: string;
  props?: PropDoc[];
  examples?: ExampleDoc[];
  notes?: string[];
}

// Component Documentation
export const componentDocs: ComponentDoc[] = [
  // ============ UI COMPONENTS ============
  {
    id: "button",
    name: "Button",
    description: "A versatile button component with multiple variants and sizes. Supports icons, loading states, and can render as different elements.",
    category: "UI",
    importPath: 'import { Button } from "@/components/ui/button"',
    props: [
      { name: "variant", type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', default: '"default"', description: "The visual style variant of the button" },
      { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "The size of the button" },
      { name: "asChild", type: "boolean", default: "false", description: "Render as a child component (e.g., for links)" },
      { name: "disabled", type: "boolean", default: "false", description: "Disable the button" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "variants",
        title: "Variants",
        description: "Different visual styles for various use cases.",
        code: `<Button variant="default">Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`,
        preview: (
          <div className="flex flex-wrap gap-2">
            <Button variant="default">Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        ),
      },
      {
        id: "sizes",
        title: "Sizes",
        description: "Available button sizes.",
        code: `<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>`,
        preview: (
          <div className="flex items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </div>
        ),
      },
      {
        id: "with-icon",
        title: "With Icon",
        description: "Buttons with icons for better visual communication.",
        code: `<Button>
  <Shield className="mr-2 h-4 w-4" />
  Protected
</Button>

<Button variant="outline">
  <Lock className="mr-2 h-4 w-4" />
  Lock
</Button>`,
        preview: (
          <div className="flex gap-2">
            <Button>
              <Shield className="mr-2 h-4 w-4" />
              Protected
            </Button>
            <Button variant="outline">
              <Lock className="mr-2 h-4 w-4" />
              Lock
            </Button>
          </div>
        ),
      },
      {
        id: "loading",
        title: "Loading State",
        description: "Show a loading spinner while an action is in progress.",
        code: `<Button disabled>
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Processing...
</Button>`,
        preview: (
          <Button disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </Button>
        ),
      },
    ],
    notes: [
      "Use the 'asChild' prop to render the button as a different element (e.g., a React Router Link).",
      "The 'icon' size is optimized for buttons containing only an icon.",
      "Always include aria-label for icon-only buttons for accessibility.",
    ],
  },
  
  {
    id: "badge",
    name: "Badge",
    description: "Small status descriptors for UI elements. Useful for labels, counts, and status indicators.",
    category: "UI",
    importPath: 'import { Badge } from "@/components/ui/badge"',
    props: [
      { name: "variant", type: '"default" | "secondary" | "destructive" | "outline"', default: '"default"', description: "The visual style variant" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "variants",
        title: "Variants",
        description: "Different badge styles for various contexts.",
        code: `<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`,
        preview: (
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        ),
      },
      {
        id: "with-icon",
        title: "With Icon",
        description: "Badges with icons for additional context.",
        code: `<Badge>
  <Bell className="mr-1 h-3 w-3" />
  Notifications
</Badge>`,
        preview: (
          <Badge>
            <Bell className="mr-1 h-3 w-3" />
            Notifications
          </Badge>
        ),
      },
    ],
  },

  {
    id: "card",
    name: "Card",
    description: "A container component for grouping related content with optional header and footer sections.",
    category: "UI",
    importPath: 'import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"',
    props: [
      { name: "className", type: "string", description: "Additional CSS classes for the card container" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic Card",
        description: "A simple card with header and content.",
        code: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description goes here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
</Card>`,
        preview: (
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Card content goes here.</p>
            </CardContent>
          </Card>
        ),
      },
    ],
    notes: [
      "Cards use the design system's card background and border colors.",
      "Use CardHeader, CardContent, and CardFooter for consistent spacing.",
    ],
  },

  {
    id: "input",
    name: "Input",
    description: "A styled text input component that supports all standard HTML input attributes. Commonly used in forms.",
    category: "UI",
    importPath: 'import { Input } from "@/components/ui/input"',
    props: [
      { name: "type", type: "string", default: '"text"', description: "HTML input type (text, email, password, etc.)" },
      { name: "placeholder", type: "string", description: "Placeholder text" },
      { name: "disabled", type: "boolean", default: "false", description: "Disable the input" },
      { name: "className", type: "string", description: "Additional CSS classes" },
      { name: "...props", type: "InputHTMLAttributes", description: "All standard HTML input attributes" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple text input.",
        code: `<Input placeholder="Enter your name" />`,
        preview: (
          <Input placeholder="Enter your name" className="max-w-sm" />
        ),
      },
      {
        id: "with-label",
        title: "With Label",
        description: "Input paired with a label for accessibility.",
        code: `<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>`,
        preview: (
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="email-demo">Email</Label>
            <Input id="email-demo" type="email" placeholder="you@example.com" />
          </div>
        ),
      },
      {
        id: "with-icon",
        title: "With Icon",
        description: "Input with an icon prefix.",
        code: `<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  <Input className="pl-9" placeholder="Search..." />
</div>`,
        preview: (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search..." />
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Disabled",
        description: "Disabled state for read-only display.",
        code: `<Input disabled placeholder="Disabled input" />`,
        preview: (
          <Input disabled placeholder="Disabled input" className="max-w-sm" />
        ),
      },
    ],
    notes: [
      "Always use with a Label component for accessibility.",
      "Use the 'type' prop to enable browser-native features (email validation, password masking, etc.).",
      "For icons, wrap in a relative container and position the icon absolutely.",
    ],
  },

  {
    id: "select",
    name: "Select",
    description: "A dropdown select component with customizable options. Built on Radix UI for accessibility.",
    category: "UI",
    importPath: 'import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"',
    props: [
      { name: "value", type: "string", description: "Controlled value" },
      { name: "defaultValue", type: "string", description: "Default value for uncontrolled usage" },
      { name: "onValueChange", type: "(value: string) => void", description: "Callback when value changes" },
      { name: "disabled", type: "boolean", default: "false", description: "Disable the select" },
      { name: "placeholder", type: "string", description: "Placeholder text (on SelectValue)" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple select with options.",
        code: `<Select>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
    <SelectItem value="orange">Orange</SelectItem>
  </SelectContent>
</Select>`,
        preview: (
          <Select>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="banana">Banana</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
            </SelectContent>
          </Select>
        ),
      },
      {
        id: "with-label",
        title: "With Label",
        description: "Select paired with a label.",
        code: `<div className="space-y-2">
  <Label htmlFor="currency">Currency</Label>
  <Select defaultValue="usd">
    <SelectTrigger id="currency">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="usd">USD - US Dollar</SelectItem>
      <SelectItem value="eur">EUR - Euro</SelectItem>
      <SelectItem value="gbp">GBP - British Pound</SelectItem>
    </SelectContent>
  </Select>
</div>`,
        preview: (
          <div className="space-y-2 w-[250px]">
            <Label htmlFor="currency-demo">Currency</Label>
            <Select defaultValue="usd">
              <SelectTrigger id="currency-demo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usd">USD - US Dollar</SelectItem>
                <SelectItem value="eur">EUR - Euro</SelectItem>
                <SelectItem value="gbp">GBP - British Pound</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ),
      },
    ],
    notes: [
      "Use defaultValue for uncontrolled usage, or value + onValueChange for controlled.",
      "SelectItem values must be unique strings.",
      "The component handles keyboard navigation automatically.",
    ],
  },

  {
    id: "dialog",
    name: "Dialog",
    description: "A modal dialog component for displaying content that requires user attention or action.",
    category: "UI",
    importPath: 'import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"',
    props: [
      { name: "open", type: "boolean", description: "Controlled open state" },
      { name: "onOpenChange", type: "(open: boolean) => void", description: "Callback when open state changes" },
      { name: "modal", type: "boolean", default: "true", description: "Whether to render as a modal" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple dialog with trigger button.",
        code: `<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
        preview: (
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Cancel</Button>
                <Button>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ),
      },
      {
        id: "with-form",
        title: "With Form",
        description: "Dialog containing a form.",
        code: `<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="John Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" defaultValue="@johndoe" />
      </div>
    </div>
    <DialogFooter>
      <Button type="submit">Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
        preview: (
          <Dialog>
            <DialogTrigger asChild>
              <Button>Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name-demo">Name</Label>
                  <Input id="name-demo" defaultValue="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username-demo">Username</Label>
                  <Input id="username-demo" defaultValue="@johndoe" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ),
      },
    ],
    notes: [
      "Use DialogTrigger with asChild to render a custom trigger element.",
      "DialogDescription is important for accessibility - it announces the dialog purpose.",
      "For controlled dialogs, use open and onOpenChange props.",
      "The dialog automatically traps focus and handles Escape key.",
    ],
  },

  {
    id: "toast",
    name: "Toast",
    description: "Notification toasts for displaying brief messages. Uses Sonner for a beautiful toast experience.",
    category: "UI",
    importPath: 'import { toast } from "sonner"',
    props: [
      { name: "message", type: "string", required: true, description: "The toast message to display" },
      { name: "description", type: "string", description: "Optional description text" },
      { name: "duration", type: "number", default: "4000", description: "Duration in milliseconds" },
      { name: "action", type: "{ label: string; onClick: () => void }", description: "Optional action button" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic Toasts",
        description: "Different toast types for various scenarios.",
        code: `// Success toast
toast.success("Changes saved successfully");

// Error toast
toast.error("Failed to save changes");

// Info toast
toast("New message received");

// Warning toast
toast.warning("Session expiring soon");`,
        preview: (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => toast.success("Changes saved successfully")}
            >
              Success
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.error("Failed to save changes")}
            >
              Error
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast("New message received")}
            >
              Info
            </Button>
            <Button 
              variant="outline" 
              onClick={() => toast.warning("Session expiring soon")}
            >
              Warning
            </Button>
          </div>
        ),
      },
      {
        id: "with-description",
        title: "With Description",
        description: "Toast with additional description text.",
        code: `toast.success("Profile updated", {
  description: "Your changes have been saved.",
});`,
        preview: (
          <Button 
            variant="outline"
            onClick={() => toast.success("Profile updated", {
              description: "Your changes have been saved.",
            })}
          >
            Show Toast with Description
          </Button>
        ),
      },
      {
        id: "with-action",
        title: "With Action",
        description: "Toast with an action button.",
        code: `toast("File deleted", {
  action: {
    label: "Undo",
    onClick: () => console.log("Undo clicked"),
  },
});`,
        preview: (
          <Button 
            variant="outline"
            onClick={() => toast("File deleted", {
              action: {
                label: "Undo",
                onClick: () => toast.success("Restored!"),
              },
            })}
          >
            Show Toast with Action
          </Button>
        ),
      },
      {
        id: "promise",
        title: "Promise Toast",
        description: "Toast that shows loading, success, and error states.",
        code: `toast.promise(
  fetchData(),
  {
    loading: "Loading...",
    success: "Data loaded!",
    error: "Failed to load data",
  }
);`,
        preview: (
          <Button 
            variant="outline"
            onClick={() => {
              const promise = new Promise((resolve) => setTimeout(resolve, 2000));
              toast.promise(promise, {
                loading: "Loading...",
                success: "Data loaded!",
                error: "Failed to load data",
              });
            }}
          >
            Show Promise Toast
          </Button>
        ),
      },
    ],
    notes: [
      "The Toaster component must be rendered in your app (usually in App.tsx).",
      "Use toast.success(), toast.error(), toast.warning() for semantic toasts.",
      "Promise toasts are great for async operations like API calls.",
      "Toasts automatically stack and dismiss after the duration.",
    ],
  },

  {
    id: "tabs",
    name: "Tabs",
    description: "A set of layered sections of content that display one panel at a time. Built on Radix UI for accessibility.",
    category: "UI",
    importPath: 'import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"',
    props: [
      { name: "defaultValue", type: "string", description: "The value of the tab that should be active by default" },
      { name: "value", type: "string", description: "Controlled value of the active tab" },
      { name: "onValueChange", type: "(value: string) => void", description: "Callback when the active tab changes" },
      { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "The orientation of the tabs" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple horizontal tabs.",
        code: `<Tabs defaultValue="account" className="w-[400px]">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account settings content here.
  </TabsContent>
  <TabsContent value="password">
    Password settings content here.
  </TabsContent>
</Tabs>`,
        preview: (
          <Tabs defaultValue="account" className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">
                <User className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="p-4 border rounded-b-lg">
              <p className="text-sm text-muted-foreground">Manage your account settings and preferences.</p>
            </TabsContent>
            <TabsContent value="settings" className="p-4 border rounded-b-lg">
              <p className="text-sm text-muted-foreground">Configure your application settings.</p>
            </TabsContent>
            <TabsContent value="billing" className="p-4 border rounded-b-lg">
              <p className="text-sm text-muted-foreground">View and manage your billing information.</p>
            </TabsContent>
          </Tabs>
        ),
      },
    ],
    notes: [
      "Each TabsTrigger value must match its corresponding TabsContent value.",
      "Use defaultValue for uncontrolled tabs, or value + onValueChange for controlled.",
      "TabsList provides the tab buttons, TabsContent holds the panel content.",
      "Keyboard navigation (arrow keys) is handled automatically.",
    ],
  },

  {
    id: "switch",
    name: "Switch",
    description: "A toggle control that allows users to switch between two states (on/off). Perfect for boolean settings.",
    category: "UI",
    importPath: 'import { Switch } from "@/components/ui/switch"',
    props: [
      { name: "checked", type: "boolean", description: "Controlled checked state" },
      { name: "defaultChecked", type: "boolean", description: "Default checked state for uncontrolled usage" },
      { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Callback when the checked state changes" },
      { name: "disabled", type: "boolean", default: "false", description: "Disable the switch" },
      { name: "id", type: "string", description: "HTML id for label association" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple toggle switch.",
        code: `<Switch />`,
        preview: (
          <Switch />
        ),
      },
      {
        id: "with-label",
        title: "With Label",
        description: "Switch paired with a label for clarity.",
        code: `<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane Mode</Label>
</div>`,
        preview: (
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode-demo" />
            <Label htmlFor="airplane-mode-demo">Airplane Mode</Label>
          </div>
        ),
      },
      {
        id: "with-description",
        title: "With Description",
        description: "Switch with label and description text.",
        code: `<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="notifications">Notifications</Label>
    <p className="text-sm text-muted-foreground">
      Receive notifications about updates
    </p>
  </div>
  <Switch id="notifications" />
</div>`,
        preview: (
          <div className="flex items-center justify-between w-full max-w-sm">
            <div className="space-y-0.5">
              <Label htmlFor="notifications-demo">Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about updates
              </p>
            </div>
            <Switch id="notifications-demo" defaultChecked />
          </div>
        ),
      },
      {
        id: "disabled",
        title: "Disabled",
        description: "Disabled switch states.",
        code: `<Switch disabled />
<Switch disabled checked />`,
        preview: (
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch id="disabled-off" disabled />
              <Label htmlFor="disabled-off" className="text-muted-foreground">Off (disabled)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="disabled-on" disabled defaultChecked />
              <Label htmlFor="disabled-on" className="text-muted-foreground">On (disabled)</Label>
            </div>
          </div>
        ),
      },
    ],
    notes: [
      "Use Switch for boolean on/off settings, not for selecting between options.",
      "Always pair with a Label for accessibility.",
      "The checked state is controlled via checked + onCheckedChange props.",
    ],
  },

  {
    id: "checkbox",
    name: "Checkbox",
    description: "A control that allows users to select one or more items from a set, or toggle a single option.",
    category: "UI",
    importPath: 'import { Checkbox } from "@/components/ui/checkbox"',
    props: [
      { name: "checked", type: "boolean | 'indeterminate'", description: "Controlled checked state" },
      { name: "defaultChecked", type: "boolean", description: "Default checked state for uncontrolled usage" },
      { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Callback when the checked state changes" },
      { name: "disabled", type: "boolean", default: "false", description: "Disable the checkbox" },
      { name: "id", type: "string", description: "HTML id for label association" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple checkbox.",
        code: `<Checkbox />`,
        preview: (
          <Checkbox />
        ),
      },
      {
        id: "with-label",
        title: "With Label",
        description: "Checkbox paired with a clickable label.",
        code: `<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">Accept terms and conditions</Label>
</div>`,
        preview: (
          <div className="flex items-center space-x-2">
            <Checkbox id="terms-demo" />
            <Label htmlFor="terms-demo">Accept terms and conditions</Label>
          </div>
        ),
      },
      {
        id: "with-description",
        title: "With Description",
        description: "Checkbox with label and helper text.",
        code: `<div className="flex items-start space-x-2">
  <Checkbox id="marketing" className="mt-1" />
  <div className="space-y-1">
    <Label htmlFor="marketing">Marketing emails</Label>
    <p className="text-sm text-muted-foreground">
      Receive emails about new products and features.
    </p>
  </div>
</div>`,
        preview: (
          <div className="flex items-start space-x-2">
            <Checkbox id="marketing-demo" className="mt-1" />
            <div className="space-y-1">
              <Label htmlFor="marketing-demo">Marketing emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about new products and features.
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "states",
        title: "States",
        description: "Different checkbox states.",
        code: `<Checkbox />
<Checkbox defaultChecked />
<Checkbox disabled />
<Checkbox disabled defaultChecked />`,
        preview: (
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="unchecked" />
              <Label htmlFor="unchecked">Unchecked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="checked" defaultChecked />
              <Label htmlFor="checked">Checked</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="disabled" disabled />
              <Label htmlFor="disabled" className="text-muted-foreground">Disabled</Label>
            </div>
          </div>
        ),
      },
    ],
    notes: [
      "Use Checkbox for multiple selections from a list, or for single boolean toggles.",
      "The label should be clickable - use htmlFor to associate with the checkbox id.",
      "Supports indeterminate state for parent checkboxes in nested lists.",
      "For on/off toggles, consider using Switch instead for better UX.",
    ],
  },

  // ============ SHARED COMPONENTS ============
  {
    id: "locked-state",
    name: "LockedState",
    description: "A shared UI component for displaying when a feature requires identity unlock. Used across multiple feature panels for consistency.",
    category: "Shared",
    importPath: 'import { LockedState } from "@/components/shared"',
    props: [
      { name: "titleKey", type: "string", default: '"identityLocked"', description: "i18n key for the title text" },
      { name: "hintKey", type: "string", default: '"unlockToAccess"', description: "i18n key for the hint/description text" },
    ],
    examples: [
      {
        id: "default",
        title: "Default",
        description: "The default locked state appearance.",
        code: `<LockedState />`,
        preview: <LockedState />,
      },
      {
        id: "custom-keys",
        title: "Custom Text",
        description: "With custom i18n keys for different contexts.",
        code: `<LockedState 
  titleKey="identityLocked" 
  hintKey="paymentsLockedHint" 
/>`,
        preview: <LockedState titleKey="identityLocked" hintKey="paymentsLockedHint" />,
      },
    ],
    notes: [
      "This component uses translation keys - ensure keys exist in your locale files.",
      "Used by BrowserPanel and PaymentsPanel when identity is locked.",
      "Centered layout with icon, title, and hint text.",
    ],
  },

  // ============ IDENTITY COMPONENTS ============
  {
    id: "identity-status",
    name: "IdentityStatus",
    description: "Displays the current identity state and provides unlock/lock actions. Shows TTL countdown when unlocked.",
    category: "Identity",
    importPath: 'import { IdentityStatus } from "@/features/identity"',
    props: [],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        description: "The component reads state from IdentityContext automatically.",
        code: `import { IdentityStatus } from "@/features/identity";

function MyComponent() {
  return (
    <div className="p-4">
      <IdentityStatus />
    </div>
  );
}`,
      },
    ],
    notes: [
      "Requires IdentityProvider to be present in the component tree.",
      "Automatically handles create, unlock, and lock actions.",
      "Shows session expiry countdown when unlocked.",
      "Highlights in amber when session is expiring soon (< 2 minutes).",
    ],
  },

  {
    id: "identity-status-compact",
    name: "IdentityStatusCompact",
    description: "A minimal identity indicator for header/navigation use. Shows status via tooltip.",
    category: "Identity",
    importPath: 'import { IdentityStatusCompact } from "@/features/identity"',
    props: [],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        description: "Compact version ideal for navigation bars.",
        code: `import { IdentityStatusCompact } from "@/features/identity";

function NavBar() {
  return (
    <nav className="flex items-center gap-4">
      <IdentityStatusCompact />
      {/* other nav items */}
    </nav>
  );
}`,
      },
    ],
    notes: [
      "Uses tooltips to display full status information.",
      "Icon-focused design for space-constrained areas.",
      "Shares logic with IdentityStatus via useIdentityActions hook.",
    ],
  },

  {
    id: "use-identity-actions",
    name: "useIdentityActions",
    description: "A hook that provides identity state and action handlers. Used internally by IdentityStatus components.",
    category: "Identity",
    importPath: 'import { useIdentityActions } from "@/features/identity"',
    props: [
      { name: "state", type: "IdentityState", description: "Current identity state" },
      { name: "isNone", type: "boolean", description: "True if no identity exists" },
      { name: "isLocked", type: "boolean", description: "True if identity is locked" },
      { name: "isUnlocked", type: "boolean", description: "True if identity is unlocked" },
      { name: "isLoading", type: "boolean", description: "True during async operations" },
      { name: "isExpiringSoon", type: "boolean", description: "True if session expires in < 2 min" },
      { name: "formatted", type: "string", description: "Formatted countdown string" },
      { name: "handleCreateIdentity", type: "() => Promise<boolean>", description: "Create new identity" },
      { name: "handleUnlock", type: "() => Promise<boolean>", description: "Unlock identity" },
      { name: "handleLock", type: "() => Promise<boolean>", description: "Lock identity" },
      { name: "getStatusText", type: "() => string", description: "Get localized status text" },
    ],
    examples: [
      {
        id: "custom-ui",
        title: "Custom Identity UI",
        description: "Build custom identity UI using the hook.",
        code: `import { useIdentityActions } from "@/features/identity";

function CustomIdentityButton() {
  const { 
    isUnlocked, 
    isLoading, 
    handleUnlock, 
    handleLock 
  } = useIdentityActions();

  return (
    <button 
      onClick={isUnlocked ? handleLock : handleUnlock}
      disabled={isLoading}
    >
      {isUnlocked ? "Lock" : "Unlock"}
    </button>
  );
}`,
      },
    ],
    notes: [
      "Provides all state and actions needed for identity management.",
      "Handles toast notifications for success states.",
      "Calculates expiring soon state (< 2 minutes).",
    ],
  },

  // ============ CONNECTION COMPONENTS ============
  {
    id: "connection-badge",
    name: "ConnectionBadge",
    description: "Displays the current connection status with appropriate styling and animation.",
    category: "Connection",
    importPath: 'import { ConnectionBadge } from "@/components/connection"',
    props: [],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        code: `import { ConnectionBadge } from "@/components/connection";

function StatusBar() {
  return (
    <div className="flex items-center gap-2">
      <ConnectionBadge />
    </div>
  );
}`,
      },
    ],
    notes: [
      "Reads connection state from BackendStatus context.",
      "Shows pulse animation when connecting.",
      "Color-coded: green for online, amber for connecting, red for offline.",
    ],
  },

  {
    id: "backend-health-indicator",
    name: "BackendHealthIndicator",
    description: "A compact indicator showing backend health status. Ideal for footer or status bar placement.",
    category: "Connection",
    importPath: 'import { BackendHealthIndicator } from "@/components/connection"',
    props: [],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        code: `import { BackendHealthIndicator } from "@/components/connection";

function Footer() {
  return (
    <footer>
      <BackendHealthIndicator />
    </footer>
  );
}`,
      },
    ],
  },

  // ============ LAYOUT COMPONENTS ============
  {
    id: "page-background",
    name: "PageBackground",
    description: "Provides consistent page background styling with optional gradient effects.",
    category: "Layout",
    importPath: 'import { PageBackground } from "@/components/layout"',
    props: [
      { name: "children", type: "ReactNode", required: true, description: "Page content" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        code: `import { PageBackground } from "@/components/layout";

function MyPage() {
  return (
    <PageBackground>
      <div className="container mx-auto p-4">
        <h1>Page Content</h1>
      </div>
    </PageBackground>
  );
}`,
      },
    ],
    notes: [
      "Applies consistent background gradient across all pages.",
      "Handles dark/light mode automatically.",
    ],
  },

  // ============ MORE UI COMPONENTS ============
  {
    id: "tooltip",
    name: "Tooltip",
    description: "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
    category: "UI",
    importPath: 'import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"',
    props: [
      { name: "delayDuration", type: "number", default: "200", description: "Delay in ms before the tooltip opens" },
      { name: "skipDelayDuration", type: "number", default: "300", description: "Time to skip delay when moving between tooltips" },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "The preferred side of the trigger to render against" },
      { name: "sideOffset", type: "number", default: "4", description: "The distance in pixels from the trigger" },
      { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "The preferred alignment against the trigger" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple tooltip on hover.",
        code: `<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="outline" size="icon">
        <HelpCircle className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>Need help?</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`,
        preview: (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Need help?</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ),
      },
      {
        id: "positions",
        title: "Positions",
        description: "Tooltips can appear on different sides.",
        code: `<TooltipProvider>
  <div className="flex gap-4">
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Top</Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Tooltip on top</p>
      </TooltipContent>
    </Tooltip>
    
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline">Bottom</Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Tooltip on bottom</p>
      </TooltipContent>
    </Tooltip>
  </div>
</TooltipProvider>`,
        preview: (
          <TooltipProvider>
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Top</Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Tooltip on top</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Bottom</Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Tooltip on bottom</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        ),
      },
    ],
    notes: [
      "Wrap your app or component tree with TooltipProvider for shared delay behavior.",
      "Use the 'asChild' prop on TooltipTrigger to use your own button or element.",
      "Tooltips are automatically accessible and support keyboard focus.",
    ],
  },

  {
    id: "popover",
    name: "Popover",
    description: "A floating panel with rich content, triggered by a button click. Useful for forms, menus, or additional information.",
    category: "UI",
    importPath: 'import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"',
    props: [
      { name: "open", type: "boolean", description: "Controlled open state" },
      { name: "onOpenChange", type: "(open: boolean) => void", description: "Callback when open state changes" },
      { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "The preferred side of the trigger to render against" },
      { name: "sideOffset", type: "number", default: "4", description: "The distance in pixels from the trigger" },
      { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "The preferred alignment against the trigger" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple popover with content.",
        code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">
      <Info className="mr-2 h-4 w-4" />
      More Info
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="space-y-2">
      <h4 className="font-medium">About Privxx</h4>
      <p className="text-sm text-muted-foreground">
        Privacy-first tunnel using quantum-safe cryptography.
      </p>
    </div>
  </PopoverContent>
</Popover>`,
        preview: (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Info className="mr-2 h-4 w-4" />
                More Info
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">About Privxx</h4>
                <p className="text-sm text-muted-foreground">
                  Privacy-first tunnel using quantum-safe cryptography.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        ),
      },
      {
        id: "with-form",
        title: "With Form",
        description: "Popover containing a small form.",
        code: `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">Set Dimensions</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="grid gap-4">
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Dimensions</h4>
        <p className="text-sm text-muted-foreground">
          Set the dimensions for the layer.
        </p>
      </div>
      <div className="grid gap-2">
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="width">Width</Label>
          <Input id="width" defaultValue="100%" className="col-span-2 h-8" />
        </div>
        <div className="grid grid-cols-3 items-center gap-4">
          <Label htmlFor="height">Height</Label>
          <Input id="height" defaultValue="25px" className="col-span-2 h-8" />
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>`,
        preview: (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Set Dimensions</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Dimensions</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the dimensions for the layer.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width-demo">Width</Label>
                    <Input id="width-demo" defaultValue="100%" className="col-span-2 h-8" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="height-demo">Height</Label>
                    <Input id="height-demo" defaultValue="25px" className="col-span-2 h-8" />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ),
      },
    ],
    notes: [
      "Unlike tooltips, popovers are triggered by click and can contain interactive content.",
      "Use for settings panels, mini forms, or detailed information.",
      "Popovers automatically handle focus management and keyboard navigation.",
    ],
  },

  {
    id: "accordion",
    name: "Accordion",
    description: "A vertically stacked set of interactive headings that each reveal a section of content.",
    category: "UI",
    importPath: 'import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"',
    props: [
      { name: "type", type: '"single" | "multiple"', default: '"single"', description: "Whether one or multiple items can be opened at the same time" },
      { name: "collapsible", type: "boolean", default: "false", description: "When type is 'single', allows closing content when clicking the open item" },
      { name: "value", type: "string | string[]", description: "Controlled value(s) of the open item(s)" },
      { name: "onValueChange", type: "(value: string | string[]) => void", description: "Callback when value changes" },
      { name: "defaultValue", type: "string | string[]", description: "Default open item(s) for uncontrolled usage" },
    ],
    examples: [
      {
        id: "single",
        title: "Single",
        description: "Only one item open at a time.",
        code: `<Accordion type="single" collapsible className="w-full">
  <AccordionItem value="item-1">
    <AccordionTrigger>What is Privxx?</AccordionTrigger>
    <AccordionContent>
      Privxx is a privacy-first tunnel for browsing and payments
      using XX Network's cMixx mixnet technology.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Is it quantum-safe?</AccordionTrigger>
    <AccordionContent>
      Yes. Privxx uses post-quantum cryptography to protect
      your data against future quantum computing threats.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-3">
    <AccordionTrigger>How does it protect my privacy?</AccordionTrigger>
    <AccordionContent>
      Privxx hides your IP, location, timing, and device fingerprints
      by routing traffic through the cMixx mixnet.
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
        preview: (
          <Accordion type="single" collapsible className="w-full max-w-md">
            <AccordionItem value="item-1">
              <AccordionTrigger>What is Privxx?</AccordionTrigger>
              <AccordionContent>
                Privxx is a privacy-first tunnel for browsing and payments
                using XX Network's cMixx mixnet technology.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it quantum-safe?</AccordionTrigger>
              <AccordionContent>
                Yes. Privxx uses post-quantum cryptography to protect
                your data against future quantum computing threats.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>How does it protect my privacy?</AccordionTrigger>
              <AccordionContent>
                Privxx hides your IP, location, timing, and device fingerprints
                by routing traffic through the cMixx mixnet.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ),
      },
      {
        id: "multiple",
        title: "Multiple",
        description: "Multiple items can be open at the same time.",
        code: `<Accordion type="multiple" className="w-full">
  <AccordionItem value="features">
    <AccordionTrigger>Features</AccordionTrigger>
    <AccordionContent>
      <ul className="list-disc pl-4 space-y-1">
        <li>End-to-end encryption</li>
        <li>Metadata protection</li>
        <li>Anonymous payments</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="security">
    <AccordionTrigger>Security</AccordionTrigger>
    <AccordionContent>
      <ul className="list-disc pl-4 space-y-1">
        <li>Post-quantum cryptography</li>
        <li>Zero-knowledge proofs</li>
        <li>Decentralized infrastructure</li>
      </ul>
    </AccordionContent>
  </AccordionItem>
</Accordion>`,
        preview: (
          <Accordion type="multiple" className="w-full max-w-md">
            <AccordionItem value="features">
              <AccordionTrigger>Features</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>End-to-end encryption</li>
                  <li>Metadata protection</li>
                  <li>Anonymous payments</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="security">
              <AccordionTrigger>Security</AccordionTrigger>
              <AccordionContent>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Post-quantum cryptography</li>
                  <li>Zero-knowledge proofs</li>
                  <li>Decentralized infrastructure</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ),
      },
    ],
    notes: [
      "Use type='single' with collapsible for FAQ-style accordions.",
      "Use type='multiple' when users need to compare content across sections.",
      "AccordionTrigger automatically includes an animated chevron icon.",
    ],
  },

  {
    id: "progress",
    name: "Progress",
    description: "A progress bar component that indicates the completion status of a task or process.",
    category: "UI",
    importPath: 'import { Progress } from "@/components/ui/progress"',
    props: [
      { name: "value", type: "number", default: "0", description: "The progress value (0-100)" },
      { name: "max", type: "number", default: "100", description: "The maximum value" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple progress indicator.",
        code: `<Progress value={33} />`,
        preview: (
          <div className="w-full max-w-md">
            <Progress value={33} />
          </div>
        ),
      },
      {
        id: "values",
        title: "Different Values",
        description: "Progress at various completion levels.",
        code: `<div className="space-y-4">
  <Progress value={0} />
  <Progress value={25} />
  <Progress value={50} />
  <Progress value={75} />
  <Progress value={100} />
</div>`,
        preview: (
          <div className="space-y-4 w-full max-w-md">
            <Progress value={0} />
            <Progress value={25} />
            <Progress value={50} />
            <Progress value={75} />
            <Progress value={100} />
          </div>
        ),
      },
      {
        id: "with-label",
        title: "With Label",
        description: "Progress bar with percentage label.",
        code: `function ProgressWithLabel() {
  const progress = 66;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}`,
        preview: (
          <div className="space-y-2 w-full max-w-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Uploading...</span>
              <span className="text-muted-foreground">66%</span>
            </div>
            <Progress value={66} />
          </div>
        ),
      },
    ],
    notes: [
      "Use for file uploads, form completion, or multi-step processes.",
      "The value should be between 0 and 100 (or 0 and max if specified).",
      "Consider adding accessible labels for screen readers.",
    ],
  },

  {
    id: "slider",
    name: "Slider",
    description: "An input component for selecting a value or range from a continuous set of values.",
    category: "UI",
    importPath: 'import { Slider } from "@/components/ui/slider"',
    props: [
      { name: "value", type: "number[]", description: "Controlled value(s)" },
      { name: "defaultValue", type: "number[]", description: "Default value(s) for uncontrolled usage" },
      { name: "onValueChange", type: "(value: number[]) => void", description: "Callback when value changes" },
      { name: "min", type: "number", default: "0", description: "Minimum value" },
      { name: "max", type: "number", default: "100", description: "Maximum value" },
      { name: "step", type: "number", default: "1", description: "Step increment" },
      { name: "disabled", type: "boolean", default: "false", description: "Disable the slider" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple slider with default settings.",
        code: `<Slider defaultValue={[50]} max={100} step={1} />`,
        preview: (
          <div className="w-full max-w-md">
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        ),
      },
      {
        id: "with-label",
        title: "With Label",
        description: "Slider with label showing current value.",
        code: `function SliderWithLabel() {
  const [value, setValue] = useState([50]);
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Label>Volume</Label>
        <span className="text-sm text-muted-foreground">{value[0]}%</span>
      </div>
      <Slider
        value={value}
        onValueChange={setValue}
        max={100}
        step={1}
      />
    </div>
  );
}`,
        preview: (
          <div className="space-y-4 w-full max-w-md">
            <div className="flex justify-between">
              <Label>Volume</Label>
              <span className="text-sm text-muted-foreground">50%</span>
            </div>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        ),
      },
      {
        id: "range",
        title: "Range Selection",
        description: "Slider with two thumbs for selecting a range.",
        code: `<Slider defaultValue={[25, 75]} max={100} step={1} />`,
        preview: (
          <div className="w-full max-w-md">
            <Slider defaultValue={[25, 75]} max={100} step={1} />
          </div>
        ),
      },
      {
        id: "steps",
        title: "Custom Steps",
        description: "Slider with larger step increments.",
        code: `<Slider defaultValue={[50]} max={100} step={10} />`,
        preview: (
          <div className="w-full max-w-md">
            <Slider defaultValue={[50]} max={100} step={10} />
          </div>
        ),
      },
    ],
    notes: [
      "Value is always an array, even for single-thumb sliders.",
      "Use two values in the array for range selection.",
      "Consider adding aria-label for accessibility.",
    ],
  },

  {
    id: "alert",
    name: "Alert",
    description: "A component for displaying important messages or notifications to users.",
    category: "UI",
    importPath: 'import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"',
    props: [
      { name: "variant", type: '"default" | "destructive"', default: '"default"', description: "The visual style variant" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "default",
        title: "Default",
        description: "Standard informational alert.",
        code: `<Alert>
  <Terminal className="h-4 w-4" />
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app using the CLI.
  </AlertDescription>
</Alert>`,
        preview: (
          <Alert className="max-w-md">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the CLI.
            </AlertDescription>
          </Alert>
        ),
      },
      {
        id: "destructive",
        title: "Destructive",
        description: "Alert for errors or critical warnings.",
        code: `<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Your session has expired. Please log in again.
  </AlertDescription>
</Alert>`,
        preview: (
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Your session has expired. Please log in again.
            </AlertDescription>
          </Alert>
        ),
      },
      {
        id: "success",
        title: "Success (Custom)",
        description: "Custom styled success alert.",
        code: `<Alert className="border-emerald-500/50 text-emerald-600 [&>svg]:text-emerald-600">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>
    Your changes have been saved successfully.
  </AlertDescription>
</Alert>`,
        preview: (
          <Alert className="max-w-md border-emerald-500/50 text-emerald-600 [&>svg]:text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success!</AlertTitle>
            <AlertDescription>
              Your changes have been saved successfully.
            </AlertDescription>
          </Alert>
        ),
      },
      {
        id: "warning",
        title: "Warning (Custom)",
        description: "Custom styled warning alert.",
        code: `<Alert className="border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    This action cannot be undone. Please proceed with caution.
  </AlertDescription>
</Alert>`,
        preview: (
          <Alert className="max-w-md border-amber-500/50 text-amber-600 [&>svg]:text-amber-600">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This action cannot be undone. Please proceed with caution.
            </AlertDescription>
          </Alert>
        ),
      },
    ],
    notes: [
      "Use the default variant for informational messages.",
      "Use destructive for errors or critical warnings.",
      "Custom success/warning styles can be achieved with className overrides.",
      "Always include an icon for better visual communication.",
    ],
  },

  {
    id: "separator",
    name: "Separator",
    description: "A visual divider that separates content into distinct sections.",
    category: "UI",
    importPath: 'import { Separator } from "@/components/ui/separator"',
    props: [
      { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "The orientation of the separator" },
      { name: "decorative", type: "boolean", default: "true", description: "Whether the separator is purely decorative" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "horizontal",
        title: "Horizontal",
        description: "Default horizontal separator.",
        code: `<div>
  <div className="space-y-1">
    <h4 className="text-sm font-medium">Privxx Tunnel</h4>
    <p className="text-sm text-muted-foreground">
      Privacy-first browsing solution.
    </p>
  </div>
  <Separator className="my-4" />
  <div className="flex h-5 items-center space-x-4 text-sm">
    <div>Settings</div>
    <Separator orientation="vertical" />
    <div>Profile</div>
    <Separator orientation="vertical" />
    <div>Logout</div>
  </div>
</div>`,
        preview: (
          <div className="w-full max-w-md">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Privxx Tunnel</h4>
              <p className="text-sm text-muted-foreground">
                Privacy-first browsing solution.
              </p>
            </div>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
              <div>Settings</div>
              <Separator orientation="vertical" />
              <div>Profile</div>
              <Separator orientation="vertical" />
              <div>Logout</div>
            </div>
          </div>
        ),
      },
      {
        id: "vertical",
        title: "Vertical",
        description: "Vertical separator between inline elements.",
        code: `<div className="flex h-5 items-center space-x-4 text-sm">
  <div>Inbox</div>
  <Separator orientation="vertical" />
  <div>Compose</div>
  <Separator orientation="vertical" />
  <div>Payments</div>
</div>`,
        preview: (
          <div className="flex h-5 items-center space-x-4 text-sm">
            <div>Inbox</div>
            <Separator orientation="vertical" />
            <div>Compose</div>
            <Separator orientation="vertical" />
            <div>Payments</div>
          </div>
        ),
      },
    ],
    notes: [
      "Use horizontal separators to divide stacked content.",
      "Use vertical separators to divide inline content.",
      "Set decorative={false} when the separator conveys semantic meaning.",
    ],
  },

  {
    id: "avatar",
    name: "Avatar",
    description: "An image element with a fallback for displaying user profile pictures.",
    category: "UI",
    importPath: 'import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"',
    props: [
      { name: "src", type: "string", description: "Image source URL (on AvatarImage)" },
      { name: "alt", type: "string", description: "Alt text for the image (on AvatarImage)" },
      { name: "className", type: "string", description: "Additional CSS classes" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Avatar with image and fallback.",
        code: `<Avatar>
  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`,
        preview: (
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
        ),
      },
      {
        id: "fallback",
        title: "Fallback Only",
        description: "Avatar with initials fallback when no image is available.",
        code: `<Avatar>
  <AvatarFallback>JD</AvatarFallback>
</Avatar>`,
        preview: (
          <Avatar>
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        ),
      },
      {
        id: "sizes",
        title: "Sizes",
        description: "Different avatar sizes using className.",
        code: `<div className="flex items-center gap-4">
  <Avatar className="h-8 w-8">
    <AvatarFallback className="text-xs">SM</AvatarFallback>
  </Avatar>
  <Avatar>
    <AvatarFallback>MD</AvatarFallback>
  </Avatar>
  <Avatar className="h-14 w-14">
    <AvatarFallback className="text-lg">LG</AvatarFallback>
  </Avatar>
  <Avatar className="h-20 w-20">
    <AvatarFallback className="text-xl">XL</AvatarFallback>
  </Avatar>
</div>`,
        preview: (
          <div className="flex items-center gap-4">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">SM</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>MD</AvatarFallback>
            </Avatar>
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">LG</AvatarFallback>
            </Avatar>
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-xl">XL</AvatarFallback>
            </Avatar>
          </div>
        ),
      },
      {
        id: "group",
        title: "Avatar Group",
        description: "Stacked avatars for showing multiple users.",
        code: `<div className="flex -space-x-4">
  <Avatar className="border-2 border-background">
    <AvatarFallback>A</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-background">
    <AvatarFallback>B</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-background">
    <AvatarFallback>C</AvatarFallback>
  </Avatar>
  <Avatar className="border-2 border-background">
    <AvatarFallback>+3</AvatarFallback>
  </Avatar>
</div>`,
        preview: (
          <div className="flex -space-x-4">
            <Avatar className="border-2 border-background">
              <AvatarFallback>A</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
              <AvatarFallback>B</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
              <AvatarFallback>C</AvatarFallback>
            </Avatar>
            <Avatar className="border-2 border-background">
              <AvatarFallback>+3</AvatarFallback>
            </Avatar>
          </div>
        ),
      },
    ],
    notes: [
      "AvatarFallback displays while the image is loading or if it fails to load.",
      "Use initials or an icon as fallback content.",
      "Size the avatar using className with h-* and w-* utilities.",
    ],
  },

  {
    id: "skeleton",
    name: "Skeleton",
    description: "A placeholder component to show while content is loading.",
    category: "UI",
    importPath: 'import { Skeleton } from "@/components/ui/skeleton"',
    props: [
      { name: "className", type: "string", description: "Additional CSS classes for sizing and shape" },
    ],
    examples: [
      {
        id: "basic",
        title: "Basic",
        description: "Simple skeleton shapes.",
        code: `<div className="space-y-2">
  <Skeleton className="h-4 w-[250px]" />
  <Skeleton className="h-4 w-[200px]" />
  <Skeleton className="h-4 w-[150px]" />
</div>`,
        preview: (
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
        ),
      },
      {
        id: "card",
        title: "Card Skeleton",
        description: "Skeleton for a card layout.",
        code: `<div className="flex items-center space-x-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[150px]" />
  </div>
</div>`,
        preview: (
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ),
      },
      {
        id: "list",
        title: "List Skeleton",
        description: "Skeleton for a list of items.",
        code: `<div className="space-y-4">
  {[1, 2, 3].map((i) => (
    <div key={i} className="flex items-center space-x-4">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  ))}
</div>`,
        preview: (
          <div className="space-y-4 w-full max-w-md">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "form",
        title: "Form Skeleton",
        description: "Skeleton for form inputs.",
        code: `<div className="space-y-4 w-full max-w-sm">
  <div className="space-y-2">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-10 w-full" />
  </div>
  <div className="space-y-2">
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-10 w-full" />
  </div>
  <Skeleton className="h-10 w-24" />
</div>`,
        preview: (
          <div className="space-y-4 w-full max-w-sm">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        ),
      },
    ],
    notes: [
      "Use skeletons to reduce perceived loading time.",
      "Match skeleton dimensions to the actual content that will load.",
      "Use rounded-full for circular skeletons (avatars, icons).",
      "Animate pulse effect is built-in via Tailwind.",
    ],
  },
];

export default componentDocs;
