/**
 * ProductionStatusBadge - Compact production status indicator
 * 
 * Displays 3 key production health indicators:
 * - API: online/offline (from /health endpoint)
 * - XXDK: ready/not ready (from /health.xxdkReady)
 * - Session: locked/unlocked/secure (from /status after auth)
 */

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { useIdentity } from "@/features/identity";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";

type StatusLevel = "ok" | "warn" | "error" | "loading";

interface StatusDot {
  level: StatusLevel;
  label: string;
  value: string;
}

const dotColors: Record<StatusLevel, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-400",
  error: "bg-red-500",
  loading: "bg-muted-foreground animate-pulse",
};

export function ProductionStatusBadge() {
  const { t } = useTranslation("ui");
  const { healthData, isLoading: healthLoading, healthError } = useBridgeHealthStatus();
  const { status: backendStatus, isLoading: statusLoading, isAuthenticated } = useBackendStatusContext();
  const { isUnlocked, isLocked } = useIdentity();

  // Derive API status
  const apiStatus: StatusDot = (() => {
    if (healthLoading) {
      return { level: "loading", label: t("prodStatus.api", "API"), value: "..." };
    }
    if (healthError || !healthData) {
      return { level: "error", label: t("prodStatus.api", "API"), value: t("prodStatus.offline", "Offline") };
    }
    return { level: "ok", label: t("prodStatus.api", "API"), value: t("prodStatus.online", "Online") };
  })();

  // Derive XXDK status
  const xxdkStatus: StatusDot = (() => {
    if (healthLoading) {
      return { level: "loading", label: "XXDK", value: "..." };
    }
    if (healthError || !healthData) {
      return { level: "error", label: "XXDK", value: "–" };
    }
    if (healthData.xxdkReady) {
      return { level: "ok", label: "XXDK", value: t("prodStatus.ready", "Ready") };
    }
    return { level: "warn", label: "XXDK", value: t("prodStatus.notReady", "Not Ready") };
  })();

  // Derive Session status
  const sessionStatus: StatusDot = (() => {
    if (!isAuthenticated) {
      return { level: "warn", label: t("prodStatus.session", "Session"), value: t("prodStatus.noAuth", "No Auth") };
    }
    if (statusLoading) {
      return { level: "loading", label: t("prodStatus.session", "Session"), value: "..." };
    }
    
    // Check connection state from backend status
    if (backendStatus.state === "secure") {
      return { level: "ok", label: t("prodStatus.session", "Session"), value: t("prodStatus.secure", "Secure") };
    }
    
    // Check identity state
    if (isUnlocked) {
      return { level: "ok", label: t("prodStatus.session", "Session"), value: t("prodStatus.unlocked", "Unlocked") };
    }
    if (isLocked) {
      return { level: "warn", label: t("prodStatus.session", "Session"), value: t("prodStatus.locked", "Locked") };
    }
    
    // Fallback to connection state
    if (backendStatus.state === "connecting") {
      return { level: "loading", label: t("prodStatus.session", "Session"), value: "..." };
    }
    
    return { level: "warn", label: t("prodStatus.session", "Session"), value: t("prodStatus.idle", "Idle") };
  })();

  const statuses = [apiStatus, xxdkStatus, sessionStatus];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "flex items-center gap-2 rounded-full border border-white/15",
            "bg-black/25 backdrop-blur-md px-3 py-1.5",
            "text-xs text-white/80",
            "transition-opacity hover:bg-black/35"
          )}
        >
          {statuses.map((s, i) => (
            <div key={s.label} className="flex items-center gap-1.5">
              {s.level === "loading" ? (
                <Loader2 className="h-2 w-2 animate-spin" />
              ) : (
                <span className={cn("h-2 w-2 rounded-full", dotColors[s.level])} />
              )}
              <span className="font-medium whitespace-nowrap">
                {s.label}
              </span>
              {i < statuses.length - 1 && (
                <span className="text-white/30 ml-1">|</span>
              )}
            </div>
          ))}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="bg-black/90 text-white border-white/10 max-w-xs">
        <div className="grid gap-1 text-xs">
          {statuses.map((s) => (
            <div key={s.label} className="flex justify-between gap-4">
              <span className="text-white/60">{s.label}:</span>
              <span className={cn(
                s.level === "ok" && "text-emerald-400",
                s.level === "warn" && "text-amber-400",
                s.level === "error" && "text-red-400"
              )}>
                {s.value}
              </span>
            </div>
          ))}
          {healthData?.version && (
            <div className="flex justify-between gap-4 pt-1 border-t border-white/10 mt-1">
              <span className="text-white/60">{t("prodStatus.version", "Version")}:</span>
              <span className="text-white/80">{healthData.version}</span>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

export default ProductionStatusBadge;
