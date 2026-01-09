import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
}

interface Props {
  children: React.ReactNode;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Privacy-first: no external error reporting
    // Only log to console for debugging in development
    if (import.meta.env.DEV) {
      console.error("AppErrorBoundary caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}

// Static fallback - no hooks to avoid context issues
function ErrorFallback() {
  const handleReload = () => {
    window.location.reload();
  };

  const handleClearAndReload = async () => {
    try {
      // Unregister service workers
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      // Clear caches
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Continue anyway
    }
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(215_25%_27%)]">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-amber-500/20">
            <AlertTriangle className="h-8 w-8 text-amber-400" aria-hidden="true" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            The app encountered an unexpected error. Please try refreshing.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button 
            className="min-h-[44px] w-full" 
            onClick={handleReload}
          >
            Refresh
          </Button>
          <Button 
            variant="outline"
            className="min-h-[44px] w-full" 
            onClick={handleClearAndReload}
          >
            Clear Cache & Refresh
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AppErrorBoundary;
