/**
 * Component Documentation Registry
 * 
 * Central registry for all component documentation.
 */

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LockedState } from "@/components/shared";
import { Shield, Lock, Loader2, Bell, Plus } from "lucide-react";

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
