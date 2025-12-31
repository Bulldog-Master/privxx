import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LayerState } from "./ConnectionPathDiagram";

export type OverallStatus = "connected" | "degraded" | "offline";

interface OverallStatusBarProps {
  layerState: LayerState;
  isMock: boolean;
  lastCheckTime?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const OverallStatusBar = ({
  layerState,
  isMock,
  lastCheckTime,
  onRefresh,
  isRefreshing = false,
}: OverallStatusBarProps) => {
  const { t } = useTranslation();

  const overallStatus = useMemo((): OverallStatus => {
    // Connected = Proxy ✅ AND Bridge ✅ AND (xxDK ready or starting)
    // Degraded = Proxy ✅ but Bridge ❌ OR xxDK not ready
    // Offline = Proxy ❌
    
    if (layerState.proxy === "unreachable") {
      return "offline";
    }
    
    if (layerState.bridge === "unreachable" || layerState.xxdk === "unreachable") {
      return "degraded";
    }
    
    if (layerState.xxdk === "starting") {
      return "degraded";
    }
    
    return "connected";
  }, [layerState]);

  const getStatusConfig = () => {
    switch (overallStatus) {
      case "connected":
        return {
          icon: CheckCircle2,
          label: t("overallStatus.connected", "Connected"),
          sublabel: t("overallStatus.connectedDesc", "All layers operational"),
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          iconColor: "text-emerald-500",
          labelColor: "text-emerald-600 dark:text-emerald-400",
        };
      case "degraded":
        return {
          icon: AlertTriangle,
          label: t("overallStatus.degraded", "Degraded"),
          sublabel: t("overallStatus.degradedDesc", "Some layers reachable, limited functionality"),
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          iconColor: "text-amber-500",
          labelColor: "text-amber-600 dark:text-amber-400",
        };
      case "offline":
        return {
          icon: XCircle,
          label: t("overallStatus.offline", "Offline"),
          sublabel: t("overallStatus.offlineDesc", "Unable to reach service"),
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
          iconColor: "text-destructive",
          labelColor: "text-destructive",
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const formatLastCheck = () => {
    if (!lastCheckTime) return null;
    
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - lastCheckTime.getTime()) / 1000);
    
    if (diffSeconds < 5) {
      return t("overallStatus.justNow", "just now");
    }
    if (diffSeconds < 60) {
      return t("overallStatus.secondsAgo", "{{count}}s ago", { count: diffSeconds });
    }
    const diffMinutes = Math.floor(diffSeconds / 60);
    return t("overallStatus.minutesAgo", "{{count}}m ago", { count: diffMinutes });
  };

  return (
    <Card className={`${statusConfig.bgColor} ${statusConfig.borderColor} border`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Status info */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusConfig.bgColor}`}>
              <StatusIcon className={`h-6 w-6 ${statusConfig.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-lg font-semibold ${statusConfig.labelColor}`}>
                  {statusConfig.label}
                </h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                  {isMock 
                    ? t("previewModeLabel", "Preview") 
                    : t("liveModeLabel", "Live")
                  }
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {statusConfig.sublabel}
              </p>
            </div>
          </div>

          {/* Last check + refresh */}
          <div className="flex items-center gap-3">
            {lastCheckTime && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("overallStatus.lastCheck", "Last Check")}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  {formatLastCheck()}
                </p>
              </div>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OverallStatusBar;
