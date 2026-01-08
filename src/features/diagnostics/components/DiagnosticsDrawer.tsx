import { Info, RefreshCw, Clock, Activity, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import StatusCard from "./StatusCard";
import StatusCardSkeleton from "./StatusCardSkeleton";
import DiagnosticsFooter from "./DiagnosticsFooter";
import BridgeStatusCard from "./BridgeStatusCard";
import ReadinessPanel from "./ReadinessPanel";
import { useDiagnosticsState } from "@/features/diagnostics/hooks";
import { getBackendStatusDisplay, getModeDisplay } from "@/features/diagnostics/utils";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { formatDistanceToNow } from "date-fns";

const DiagnosticsDrawer = () => {
  const {
    open,
    setOpen,
    copied,
    isRetrying,
    showSuccess,
    isDismissing,
    status,
    uiState,
    isLoading,
    refetch,
    handleRetry,
    copyStatus,
    t,
  } = useDiagnosticsState();

  const { autoRetry, rateLimit } = useBackendStatusContext();

  const backendStatus = getBackendStatusDisplay(uiState, isLoading, t);
  const modeStatus = getModeDisplay(status.isMock, t);

  // Format last check time
  const lastCheckDisplay = status.lastCheckAt
    ? formatDistanceToNow(new Date(status.lastCheckAt), { addSuffix: true })
    : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-primary/70 hover:text-primary"
          aria-label="View system status"
        >
          <Info className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
          <span className="text-primary/70">Status</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-auto max-h-[70vh] overflow-y-auto">
        <div className={`transition-all duration-300 ease-out ${isDismissing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-semibold">
              {t("diagnosticsTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-6" role="region" aria-label="System status information">
            {/* Rate Limit Warning */}
            {rateLimit.isRateLimited && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {t("rateLimit.active", "Rate limited")}
                  </span>
                  <span className="ml-auto font-mono text-xs">
                    {rateLimit.formattedTime}
                  </span>
                </div>
              </div>
            )}

            {/* Auto-Retry Status */}
            {autoRetry.isWaiting && !autoRetry.isExhausted && (
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 animate-fade-in">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-medium">
                    {t("autoRetry.waiting", "Auto-retrying")}
                  </span>
                  <span className="ml-auto font-mono text-xs">
                    {autoRetry.formattedTime} ({autoRetry.attempt}/{autoRetry.maxRetries})
                  </span>
                </div>
              </div>
            )}

            {/* Bridge Status Card (JWT, Identity, TTL) */}
            <BridgeStatusCard />

            {/* Backend Status */}
            {isLoading ? (
              <StatusCardSkeleton titleWidth="w-16" subtitleWidth="w-24" labelWidth="w-14" />
            ) : (
              <StatusCard
                icon={backendStatus.icon}
                iconColor={backendStatus.color}
                bgColor={backendStatus.bgColor}
                title={t("diagnosticsBackend")}
                subtitle={t("diagnosticsBackendSubtext")}
                label={backendStatus.label}
                labelColor={backendStatus.color}
                pulse={backendStatus.pulse}
                showSuccess={showSuccess}
                actions={
                  uiState === "error" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-7 px-3 text-xs transition-all duration-300 ${isRetrying ? 'scale-95 opacity-70' : ''}`}
                      onClick={handleRetry}
                      disabled={isLoading || isRetrying}
                    >
                      <RefreshCw 
                        className={`h-3 w-3 mr-1.5 transition-transform duration-300 ${isRetrying ? "animate-spin" : ""}`} 
                        aria-hidden="true" 
                      />
                      {t("diagnosticsRetry")}
                    </Button>
                  ) : undefined
                }
              />
            )}

            {/* Connection Details */}
            {!isLoading && (
              <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3 w-3" />
                  {t("diagnostics.connectionDetails", "Connection Details")}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {status.latencyMs !== null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("diagnostics.latency", "Latency")}</span>
                      <span className="font-mono">{status.latencyMs}ms</span>
                    </div>
                  )}
                  {status.failureCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("diagnostics.failures", "Failures")}</span>
                      <span className="font-mono text-destructive">{status.failureCount}</span>
                    </div>
                  )}
                  {lastCheckDisplay && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("diagnostics.lastCheck", "Last check")}
                      </span>
                      <span className="text-foreground/70">{lastCheckDisplay}</span>
                    </div>
                  )}
                  {status.lastErrorCode && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-muted-foreground">{t("diagnostics.lastError", "Last error")}</span>
                      <span className="font-mono text-destructive text-[10px]">{status.lastErrorCode}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mode Status */}
            {isLoading ? (
              <StatusCardSkeleton titleWidth="w-12" subtitleWidth="w-28" labelWidth="w-16" />
            ) : (
              <StatusCard
                icon={modeStatus.icon}
                iconColor={modeStatus.color}
                bgColor={modeStatus.bgColor}
                title={t("diagnosticsMode")}
                subtitle={modeStatus.sublabel}
                label={modeStatus.label}
                labelColor={modeStatus.color}
              />
            )}

            {/* Readiness Panel (for cutover verification) */}
            {!isLoading && <ReadinessPanel />}

            {/* Version & Actions */}
            <DiagnosticsFooter
              isLoading={isLoading}
              copied={copied}
              onRefresh={refetch}
              onCopy={copyStatus}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DiagnosticsDrawer;
