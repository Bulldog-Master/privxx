import type { BackendStatus } from "@/hooks/useBackendStatus";
import { useBackendStatusShared } from "@/contexts/BackendStatusContext";
import { useTranslation } from "react-i18next";
import { Wifi, WifiOff, Loader2 } from "lucide-react";

type ConnectionState = "connected" | "degraded" | "error";

function deriveConnectionState(status: BackendStatus): ConnectionState {
  if (status.state === "error") {
    return "error";
  }
  if (status.state === "connecting") {
    return "degraded";
  }
  return "connected";
}

export function ConnectionBadge() {
  const { t } = useTranslation();
  const { status, isLoading } = useBackendStatusShared();

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary/70 text-xs">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>{t("connectionChecking", "Checking...")}</span>
      </div>
    );
  }

  const state = deriveConnectionState(status);

  const config = {
    connected: {
      icon: Wifi,
      label: t("connectionConnected", "Connected"),
      className: "bg-emerald-500/10 text-emerald-500",
    },
    degraded: {
      icon: Wifi,
      label: t("connectionDegraded", "Connecting..."),
      className: "bg-amber-500/10 text-amber-500",
    },
    error: {
      icon: WifiOff,
      label: t("connectionError", "Offline"),
      className: "bg-destructive/10 text-destructive",
    },
  }[state];

  const Icon = config.icon;

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${config.className}`}
      role="status"
      aria-live="polite"
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </div>
  );
}
