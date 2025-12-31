import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  StatusCard,
  StatusCardSkeleton,
  DiagnosticsFooter,
  useDiagnosticsState,
  getBackendStatusDisplay,
  getModeDisplay,
  BridgeStatusCard,
  BridgeLiveStatusCard,
} from "@/features/diagnostics";
import ReadinessPanel from "@/components/diagnostics/ReadinessPanel";
import { StatusPill } from "./StatusPill";
import { buildInfo } from "@/lib/buildInfo";

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

  const backendStatus = getBackendStatusDisplay(uiState, isLoading, t);
  const modeStatus = getModeDisplay(status.isMock, t);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <StatusPill />
      </SheetTrigger>

      <SheetContent side="bottom" className="h-auto max-h-[70vh] overflow-y-auto">
        <div className={`transition-all duration-300 ease-out ${isDismissing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-semibold">
              {t("diagnosticsTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-6" role="region" aria-label="System status information">
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

            {/* Bridge Live Status (xxdk/info, cmixx/status) */}
            <BridgeLiveStatusCard />

            {/* Readiness Panel (for cutover verification) */}
            {!isLoading && <ReadinessPanel />}

            {/* Preview notice - moved from footer to diagnostics */}
            <div className="text-xs text-muted-foreground/70 text-center pt-2 border-t border-border/50">
              <span>{t("demoModeNotice")}</span>
              <span className="ml-2 text-muted-foreground/50">v{buildInfo.version}</span>
            </div>

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
