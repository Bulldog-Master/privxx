/**
 * ConnectionStatusBadge
 * 
 * Displays current bridge connection status in header.
 * IMPORTANT: Uses useBackendStatus as the SINGLE source for /status calls
 * to prevent duplicate polling and rate-limit issues.
 */

import { useTranslation } from "react-i18next";
import { Shield, ShieldAlert, ShieldCheck, Loader2, Clock } from "lucide-react";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { useDiagnosticsDrawerOptional } from "@/features/diagnostics/context";
import { cn } from "@/lib/utils";

interface ConnectionStatusBadgeProps {
  className?: string;
  showLabel?: boolean;
}

const ConnectionStatusBadge = ({ className, showLabel = true }: ConnectionStatusBadgeProps) => {
  const { t } = useTranslation();
  const drawerContext = useDiagnosticsDrawerOptional();
  
  // Use the centralized backend status context - SINGLE source for /status calls
  const { status, isLoading, rateLimit } = useBackendStatusContext();

  const handleClick = () => {
    drawerContext?.open();
  };

  // Determine state and styling based on centralized status
  const getStateConfig = () => {
    if (isLoading && status.state === "idle" && status.health === "checking") {
      return {
        icon: Loader2,
        label: t("loading", "Loading"),
        bg: "bg-muted/50",
        text: "text-muted-foreground",
        border: "border-transparent",
        pulse: false,
        spin: true,
      };
    }

    if (rateLimit.isRateLimited) {
      return {
        icon: Clock,
        label: rateLimit.formattedTime,
        bg: "bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/20",
        pulse: false,
        spin: false,
      };
    }

    // Connection states
    switch (status.state) {
      case "secure":
        return {
          icon: ShieldCheck,
          label: t("stateSecure", "Secure"),
          bg: "bg-emerald-500/10",
          text: "text-emerald-600 dark:text-emerald-400",
          border: "border-emerald-500/20",
          pulse: false,
          spin: false,
        };
      case "connecting":
        return {
          icon: Shield,
          label: t("stateConnecting", "Connecting"),
          bg: "bg-amber-500/10",
          text: "text-amber-600 dark:text-amber-400",
          border: "border-amber-500/20",
          pulse: true,
          spin: false,
        };
      case "idle":
        return {
          icon: Shield,
          label: t("stateIdle", "Idle"),
          bg: "bg-muted/50",
          text: "text-muted-foreground",
          border: "border-border/50",
          pulse: false,
          spin: false,
        };
      case "error":
        // Check if it's an auth error (show as idle, not error)
        if (status.lastErrorCode === "UNAUTHORIZED") {
          return {
            icon: ShieldAlert,
            label: t("stateIdle", "Idle"),
            bg: "bg-muted/50",
            text: "text-muted-foreground",
            border: "border-border/50",
            pulse: false,
            spin: false,
          };
        }
        return {
          icon: ShieldAlert,
          label: t("error", "Error"),
          bg: "bg-destructive/10",
          text: "text-destructive",
          border: "border-destructive/20",
          pulse: false,
          spin: false,
        };
      default:
        return {
          icon: Shield,
          label: t("stateIdle", "Idle"),
          bg: "bg-muted/50",
          text: "text-muted-foreground",
          border: "border-border/50",
          pulse: false,
          spin: false,
        };
    }
  };

  const config = getStateConfig();
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border",
        "cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/50",
        config.bg,
        config.text,
        config.border,
        className
      )}
      title={t("openDiagnostics", "Open Diagnostics")}
    >
      <Icon className={cn(
        "h-3 w-3", 
        config.pulse && "animate-pulse",
        config.spin && "animate-spin"
      )} />
      {showLabel && <span>{config.label}</span>}
    </button>
  );
};

export default ConnectionStatusBadge;
