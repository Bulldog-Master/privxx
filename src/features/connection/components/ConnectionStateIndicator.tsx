/**
 * ConnectionStateIndicator
 * 
 * Prominent visual indicator showing real-time bridge connection state.
 * Displays in the hero area with animated states.
 */

import { useTranslation } from "react-i18next";
import { Shield, ShieldCheck, ShieldOff, Loader2, WifiOff } from "lucide-react";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { cn } from "@/lib/utils";

interface ConnectionStateIndicatorProps {
  className?: string;
}

export function ConnectionStateIndicator({ className }: ConnectionStateIndicatorProps) {
  const { t } = useTranslation();
  const { status, isLoading, isAuthenticated } = useBackendStatusContext();

  const getIndicatorConfig = () => {
    // During auth initialization or initial status check, show "Checking..." 
    // This prevents flash of "Sign In Required" before auth state settles
    const isAuthInitializing = isLoading && status.lastCheckAt === null;
    const isInitialCheck = isAuthInitializing && status.health === "checking";
    
    if (isInitialCheck || isAuthInitializing) {
      return {
        icon: Loader2,
        label: t("connection.checking", "Checking..."),
        sublabel: t("connection.checkingSub", "Verifying bridge status"),
        color: "text-muted-foreground",
        bgColor: "bg-muted/30",
        borderColor: "border-muted/50",
        iconSpin: true,
        pulse: false,
      };
    }
    
    // Not authenticated - show login prompt state (only after auth has initialized)
    if (!isAuthenticated) {
      return {
        icon: Shield,
        label: t("connection.loginRequired", "Sign In Required"),
        sublabel: t("connection.loginRequiredSub", "Sign in to connect"),
        color: "text-muted-foreground",
        bgColor: "bg-muted/20",
        borderColor: "border-muted/40",
        iconSpin: false,
        pulse: false,
      };
    }

    // Offline/unreachable
    if (status.health === "offline") {
      return {
        icon: WifiOff,
        label: t("connection.offline", "Offline"),
        sublabel: t("connection.offlineSub", "Bridge unreachable"),
        color: "text-destructive",
        bgColor: "bg-destructive/5",
        borderColor: "border-destructive/20",
        iconSpin: false,
        pulse: false,
      };
    }

    // Connection states
    switch (status.state) {
      case "secure":
        return {
          icon: ShieldCheck,
          label: t("connection.secure", "Secure"),
          sublabel: t("connection.secureSub", "Private tunnel active"),
          color: "text-emerald-600 dark:text-emerald-400",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
          iconSpin: false,
          pulse: false,
        };
      case "connecting":
        return {
          icon: Shield,
          label: t("connection.connecting", "Connecting"),
          sublabel: t("connection.connectingSub", "Establishing tunnel..."),
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-500/10",
          borderColor: "border-amber-500/30",
          iconSpin: false,
          pulse: true,
        };
      case "error":
        return {
          icon: ShieldOff,
          label: t("connection.error", "Error"),
          sublabel: status.lastErrorCode === "UNAUTHORIZED" 
            ? t("connection.loginRequired", "Login required")
            : t("connection.errorSub", "Connection failed"),
          color: "text-destructive",
          bgColor: "bg-destructive/5",
          borderColor: "border-destructive/20",
          iconSpin: false,
          pulse: false,
        };
      case "idle":
      default:
        return {
          icon: Shield,
          label: t("connection.idle", "Ready"),
          sublabel: t("connection.idleSub", "Awaiting connection"),
          color: "text-primary/70",
          bgColor: "bg-primary/5",
          borderColor: "border-primary/20",
          iconSpin: false,
          pulse: false,
        };
    }
  };

  const config = getIndicatorConfig();
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 px-4 py-2.5 rounded-full border backdrop-blur-sm transition-all duration-300",
        config.bgColor,
        config.borderColor,
        config.pulse && "animate-pulse",
        className
      )}
    >
      <Icon 
        className={cn(
          "h-5 w-5 flex-shrink-0",
          config.color,
          config.iconSpin && "animate-spin"
        )} 
      />
      <div className="flex flex-col">
        <span className={cn("text-sm font-semibold leading-tight", config.color)}>
          {config.label}
        </span>
        <span className="text-xs text-muted-foreground leading-tight">
          {config.sublabel}
        </span>
      </div>
    </div>
  );
}

export default ConnectionStateIndicator;
