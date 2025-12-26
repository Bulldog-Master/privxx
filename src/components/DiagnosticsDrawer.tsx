import { useState } from "react";
import { Info, CheckCircle2, XCircle, AlertCircle, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";

const DiagnosticsDrawer = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { status, isLoading, refetch } = useBackendStatus();
  const { t } = useTranslations();

  const copyStatus = async () => {
    const modeLabel = status.isMock ? t("previewModeLabel") : t("liveModeLabel");
    const backendLabel = isLoading 
      ? t("diagnosticsChecking") 
      : status.state === "error" 
        ? t("diagnosticsOffline") 
        : status.state === "starting" 
          ? t("diagnosticsConnecting") 
          : t("diagnosticsOnline");
    const statusText = `${t("diagnosticsMode")}: ${modeLabel}, ${t("diagnosticsBackend")}: ${backendLabel}`;
    
    try {
      await navigator.clipboard.writeText(statusText);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const getBackendStatusDisplay = () => {
    if (isLoading) {
      return {
        label: t("diagnosticsChecking"),
        icon: AlertCircle,
        color: "text-muted-foreground",
        bgColor: "bg-muted",
      };
    }

    if (status.state === "error") {
      return {
        label: t("diagnosticsOffline"),
        icon: XCircle,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      };
    }

    if (status.state === "starting") {
      return {
        label: t("diagnosticsConnecting"),
        icon: AlertCircle,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
      };
    }

    return {
      label: t("diagnosticsOnline"),
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    };
  };

  const getModeDisplay = () => {
    if (status.isMock) {
      return {
        label: t("previewModeLabel"),
        sublabel: t("diagnosticsModeSimulated"),
        icon: Info,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
      };
    }

    return {
      label: t("liveModeLabel"),
      sublabel: t("diagnosticsModeLive"),
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
            {t("diagnosticsTitle")}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pb-6" role="region" aria-label="System status information">
          {/* Backend Status */}
          {isLoading ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted animate-fade-in">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-14" />
            </div>
          ) : (
            <div 
              className={`flex items-center justify-between p-4 rounded-lg ${backendStatus.bgColor} animate-fade-in`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <backendStatus.icon className={`h-5 w-5 ${backendStatus.color}`} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("diagnosticsBackend")}</p>
                  <p className="text-xs text-muted-foreground">{t("diagnosticsBackendSubtext")}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${backendStatus.color}`}>
                {backendStatus.label}
              </span>
            </div>
          )}

          {/* Mode Status */}
          {isLoading ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted animate-fade-in">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ) : (
            <div 
              className={`flex items-center justify-between p-4 rounded-lg ${modeStatus.bgColor} animate-fade-in`}
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center gap-3">
                <modeStatus.icon className={`h-5 w-5 ${modeStatus.color}`} aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("diagnosticsMode")}</p>
                  <p className="text-xs text-muted-foreground">{modeStatus.sublabel}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${modeStatus.color}`}>
                {modeStatus.label}
              </span>
            </div>
          )}

          {/* Version Info */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {t("diagnosticsVersion")}
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={refetch}
                disabled={isLoading}
                aria-label={t("diagnosticsRefresh")}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={copyStatus}
                aria-label={t("diagnosticsCopy")}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DiagnosticsDrawer;
