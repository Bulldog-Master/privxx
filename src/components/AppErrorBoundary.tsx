import React from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
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
    if (process.env.NODE_ENV === "development") {
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

function ErrorFallback() {
  const { t } = useTranslations();

  const handleReload = () => {
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
            {t("errorConnectionFailed")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("errorTryAgain")}
          </p>
        </div>
        <Button 
          className="min-h-[44px]" 
          onClick={handleReload}
        >
          {t("retryConnection")}
        </Button>
      </div>
    </div>
  );
}

export default AppErrorBoundary;
