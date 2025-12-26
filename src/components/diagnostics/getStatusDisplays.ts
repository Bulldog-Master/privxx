import { Info, CheckCircle2, XCircle, AlertCircle, LucideIcon } from "lucide-react";

type TranslationFn = (key: string) => string;

interface StatusDisplay {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  pulse?: boolean;
}

interface ModeDisplay {
  label: string;
  sublabel: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export function getBackendStatusDisplay(
  state: string,
  isLoading: boolean,
  t: TranslationFn
): StatusDisplay {
  if (isLoading) {
    return {
      label: t("diagnosticsChecking"),
      icon: AlertCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      pulse: true,
    };
  }

  if (state === "error") {
    return {
      label: t("diagnosticsOffline"),
      icon: XCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      pulse: false,
    };
  }

  if (state === "starting") {
    return {
      label: t("diagnosticsConnecting"),
      icon: AlertCircle,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      pulse: true,
    };
  }

  return {
    label: t("diagnosticsOnline"),
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    pulse: false,
  };
}

export function getModeDisplay(isMock: boolean, t: TranslationFn): ModeDisplay {
  if (isMock) {
    return {
      label: t("previewModeLabel"),
      sublabel: t("diagnosticsModeSimulated"),
      icon: Info,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    };
  }

  return {
    label: t("liveModeLabel"),
    sublabel: t("diagnosticsModeLive"),
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  };
}
