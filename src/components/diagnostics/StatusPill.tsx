import * as React from "react";
import { ChevronUp, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import type { BackendStatus } from "@/hooks/useBackendStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type OverallStatus = "connected" | "degraded" | "offline" | "loading";

function deriveOverallStatus(
  backendStatus: BackendStatus,
  backendLoading: boolean,
  bridgeHealth: { health: boolean | null; isLoading: boolean; healthError: boolean }
): OverallStatus {
  // Only show "Checking..." during the very first load.
  // During regular polling, keep the last known state to prevent UI flashing.
  const isInitialBackendCheck =
    backendLoading && backendStatus.lastCheckAt === null && backendStatus.health === "checking";
  const isInitialHealthCheck = bridgeHealth.isLoading && bridgeHealth.health === null;

  if (isInitialBackendCheck || isInitialHealthCheck) {
    return "loading";
  }

  if (backendStatus.state === "error" || bridgeHealth.healthError) {
    return "offline";
  }

  if (backendStatus.state === "connecting" || bridgeHealth.health === false) {
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
    dotColor: "bg-amber-400",
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
} as const;

interface StatusPillProps {
  onClick?: () => void;
  className?: string;
}

export const StatusPill = React.forwardRef<HTMLButtonElement, StatusPillProps>(
  ({ onClick, className }, ref) => {
    const { t } = useTranslation();
    const { status: backendStatus, isLoading: backendLoading } = useBackendStatusContext();
    const bridgeHealth = useBridgeHealthStatus();

    const overallStatus = deriveOverallStatus(backendStatus, backendLoading, bridgeHealth);
    const config = statusConfig[overallStatus];

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            ref={ref}
            type="button"
            onClick={onClick}
            className={cn(
              "fixed bottom-3 left-1/2 -translate-x-1/2 z-50",
              "flex items-center gap-2 rounded-full border border-white/15",
              "bg-black/25 backdrop-blur-md px-4 py-2",
              "h-11 shadow-lg",
              "text-sm text-white/90",
              "transition-all duration-200 hover:bg-black/35 hover:border-white/25",
              "active:scale-95",
              className
            )}
            aria-label={t("statusPill.openDiagnostics", "View system status")}
          >
            {overallStatus === "loading" ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" aria-hidden="true" />
            ) : (
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  config.dotColor,
                  overallStatus === "degraded" && "animate-pulse"
                )}
                aria-hidden="true"
              />
            )}
            <span className="whitespace-nowrap font-medium">{t(config.label, config.fallback)}</span>
            <ChevronUp className="h-4 w-4 text-white/60" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black/80 text-white border-white/10">
          {t("statusPill.tapForDiagnostics", "Tap for diagnostics")}
        </TooltipContent>
      </Tooltip>
    );
  }
);

StatusPill.displayName = "StatusPill";

export default StatusPill;
