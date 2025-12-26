import { Info, RefreshCw } from "lucide-react";
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
} from "@/components/diagnostics";
import ReadinessPanel from "@/components/diagnostics/ReadinessPanel";

const DiagnosticsDrawer = () => {
  const {
    open,
    setOpen,
    copied,
    isRetrying,
    showSuccess,
    isDismissing,
    status,
    isLoading,
    refetch,
    handleRetry,
    copyStatus,
    t,
  } = useDiagnosticsState();

  const backendStatus = getBackendStatusDisplay(status.state, isLoading, t);
  const modeStatus = getModeDisplay(status.isMock, t);

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
        <div className={`transition-all duration-300 ease-out ${isDismissing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <SheetHeader className="pb-4">
            <SheetTitle className="text-lg font-semibold">
              {t("diagnosticsTitle")}
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-6" role="region" aria-label="System status information">
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
                  status.state === "error" ? (
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
