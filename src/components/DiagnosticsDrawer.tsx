import { useState } from "react";
import { Info, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { useTranslations } from "@/lib/i18n";

const DiagnosticsDrawer = () => {
  const [open, setOpen] = useState(false);
  const { status, isLoading } = useBackendStatus();
  const { t } = useTranslations();

  const getBackendStatusDisplay = () => {
    if (isLoading) {
      return {
        label: "Checking…",
        icon: AlertCircle,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
    }

    if (status.state === "error") {
      return {
        label: "Offline",
        icon: XCircle,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      };
    }

    if (status.state === "starting") {
      return {
        label: "Connecting",
        icon: AlertCircle,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      };
    }

    return {
      label: "Online",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    };
  };

  const getModeDisplay = () => {
    if (status.isMock) {
      return {
        label: t("previewModeLabel"),
        sublabel: "Simulated routing",
        icon: Info,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      };
    }

    return {
      label: t("liveModeLabel"),
      sublabel: "Real network routing",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    };
  };

  const backendStatus = getBackendStatusDisplay();
  const modeStatus = getModeDisplay();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label="View system status"
        >
          <Info className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          Status
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-auto max-h-[50vh]">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg font-semibold">
            System Status
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6" role="region" aria-label="System status information">
          {/* Backend Status */}
          <div 
            className={`flex items-center justify-between p-4 rounded-lg ${backendStatus.bgColor}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <backendStatus.icon className={`h-5 w-5 ${backendStatus.color}`} aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">Backend</p>
                <p className="text-xs text-muted-foreground">Connection status</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${backendStatus.color}`}>
              {backendStatus.label}
            </span>
          </div>

          {/* Mode Status */}
          <div 
            className={`flex items-center justify-between p-4 rounded-lg ${modeStatus.bgColor}`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <modeStatus.icon className={`h-5 w-5 ${modeStatus.color}`} aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">Mode</p>
                <p className="text-xs text-muted-foreground">{modeStatus.sublabel}</p>
              </div>
            </div>
            <span className={`text-sm font-semibold ${modeStatus.color}`}>
              {modeStatus.label}
            </span>
          </div>

          {/* Version Info */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Privxx v0.2.0 • Frontend Complete
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DiagnosticsDrawer;
