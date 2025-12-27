/**
 * Component Documentation Registry
 * 
 * Central registry for all component documentation.
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { LockedState } from "@/components/shared";
import { Shield, Lock, Loader2, Bell, Plus, Search, Mail, Eye, EyeOff } from "lucide-react";
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
    importPath: 'import { IdentityStatus } from "@/components/identity"',
    props: [],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        description: "The component reads state from IdentityContext automatically.",
        code: `import { IdentityStatus } from "@/components/identity";

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
    importPath: 'import { IdentityStatusCompact } from "@/components/identity"',
    props: [],
    examples: [
      {
        id: "usage",
        title: "Basic Usage",
        description: "Compact version ideal for navigation bars.",
        code: `import { IdentityStatusCompact } from "@/components/identity";

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
    importPath: 'import { useIdentityActions } from "@/components/identity"',
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
        code: `import { useIdentityActions } from "@/components/identity";

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
];

export default componentDocs;
