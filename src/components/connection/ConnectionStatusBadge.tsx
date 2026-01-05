import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Clock } from "lucide-react";
import { fetchBridgeStatusRaw, type BridgeUiStatus } from "@/api/bridge/statusUtils";
import { useRateLimitCountdown } from "@/features/diagnostics/hooks/useRateLimitCountdown";
import { cn } from "@/lib/utils";

interface ConnectionStatusBadgeProps {
  className?: string;
  showLabel?: boolean;
}

const ConnectionStatusBadge = ({ className, showLabel = true }: ConnectionStatusBadgeProps) => {
  const { t } = useTranslation();
  const [statusUi, setStatusUi] = useState<BridgeUiStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const rateLimit = useRateLimitCountdown(() => {
    fetchStatus();
  });

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchBridgeStatusRaw();
      setStatusUi(result.ui);
      
      if (result.ui.kind === "rate_limited") {
        rateLimit.startCountdown(result.ui.retryUntil);
      } else {
        rateLimit.clearCountdown();
      }
    } catch {
      setStatusUi({ kind: "error", message: "Failed" });
    } finally {
      setLoading(false);
    }
  }, [rateLimit]);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => {
      if (!rateLimit.isRateLimited) {
        fetchStatus();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus, rateLimit.isRateLimited]);

  if (loading && !statusUi) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        "bg-muted/50 text-muted-foreground",
        className
      )}>
        <Loader2 className="h-3 w-3 animate-spin" />
        {showLabel && <span>{t("loading", "Loading")}</span>}
      </div>
    );
  }

  // Rate limited
  if (rateLimit.isRateLimited) {
    return (
      <div className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
        className
      )}>
        <Clock className="h-3 w-3" />
        {showLabel && <span>{rateLimit.formattedTime}</span>}
      </div>
    );
  }

  // Determine state and styling
  const getStateConfig = () => {
    if (statusUi?.kind === "ok") {
      switch (statusUi.state) {
        case "secure":
          return {
            icon: ShieldCheck,
            label: t("stateSecure", "Secure"),
            bg: "bg-emerald-500/10",
            text: "text-emerald-600 dark:text-emerald-400",
            border: "border-emerald-500/20",
            pulse: false,
          };
        case "connecting":
          return {
            icon: Shield,
            label: t("stateConnecting", "Connecting"),
            bg: "bg-amber-500/10",
            text: "text-amber-600 dark:text-amber-400",
            border: "border-amber-500/20",
            pulse: true,
          };
        case "idle":
        default:
          return {
            icon: Shield,
            label: t("stateIdle", "Idle"),
            bg: "bg-muted/50",
            text: "text-muted-foreground",
            border: "border-border/50",
            pulse: false,
          };
      }
    }
    
    if (statusUi?.kind === "login_required" || statusUi?.kind === "token_invalid") {
      return {
        icon: ShieldAlert,
        label: t("stateIdle", "Idle"),
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        border: "border-border/50",
        pulse: false,
      };
    }

    // Error state
    return {
      icon: ShieldAlert,
      label: t("error", "Error"),
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/20",
      pulse: false,
    };
  };

  const config = getStateConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
      config.bg,
      config.text,
      config.border,
      className
    )}>
      <Icon className={cn("h-3 w-3", config.pulse && "animate-pulse")} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
};

export default ConnectionStatusBadge;
