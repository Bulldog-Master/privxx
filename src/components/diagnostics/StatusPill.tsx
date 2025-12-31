import { Info, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { useBackendStatus } from "@/hooks/useBackendStatus";

type OverallStatus = "connected" | "degraded" | "offline" | "loading";

function deriveOverallStatus(
  backendStatus: { status: string; backend: string; network: string },
  backendLoading: boolean,
  bridgeHealth: { health: boolean | null; isLoading: boolean; healthError: boolean }
): OverallStatus {
  if (backendLoading || bridgeHealth.isLoading) {
    return "loading";
  }
  
  if (backendStatus.status === "error" || backendStatus.backend === "error" || bridgeHealth.healthError) {
    return "offline";
  }
  
  if (backendStatus.backend === "disconnected" || backendStatus.network === "syncing" || bridgeHealth.health === false) {
    return "degraded";
  }
  
  return "connected";
}

const statusConfig = {
  connected: {
    dotColor: "bg-emerald-500",
    label: "overallStatus.connected",
    fallback: "Online",
  },
  degraded: {
    dotColor: "bg-amber-500",
    label: "overallStatus.degraded", 
    fallback: "Connecting",
  },
  offline: {
    dotColor: "bg-red-500",
    label: "overallStatus.offline",
    fallback: "Offline",
  },
  loading: {
    dotColor: "bg-muted-foreground",
    label: "overallStatus.checking",
    fallback: "Checking...",
  },
};

interface StatusPillProps {
  onClick?: () => void;
}

export function StatusPill({ onClick }: StatusPillProps) {
  const { t } = useTranslation();
  const { status: backendStatus, isLoading: backendLoading } = useBackendStatus();
  const bridgeHealth = useBridgeHealthStatus();
  
  const overallStatus = deriveOverallStatus(backendStatus, backendLoading, bridgeHealth);
  const config = statusConfig[overallStatus];
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-7 px-2.5 gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      aria-label={t("statusPill.openDiagnostics", "View system status")}
    >
      {overallStatus === "loading" ? (
        <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
      ) : (
        <span 
          className={`h-2 w-2 rounded-full ${config.dotColor} ${overallStatus === "degraded" ? "animate-pulse" : ""}`}
          aria-hidden="true"
        />
      )}
      <span>{t(config.label, config.fallback)}</span>
      <Info className="h-3 w-3 opacity-50" aria-hidden="true" />
    </Button>
  );
}

export default StatusPill;
