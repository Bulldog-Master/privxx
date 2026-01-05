import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useBackendStatus, type BackendStatus } from "@/hooks/useBackendStatus";
import { toast } from "sonner";

/** Derive UI state from bridge status */
function deriveUiState(status: BackendStatus): "error" | "connecting" | "ready" {
  if (status.state === "error") return "error";
  if (status.state === "connecting") return "connecting";
  if (status.state === "secure") return "ready";
  return "ready"; // idle is also considered ready
}

export function useDiagnosticsState() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const prevStateRef = useRef<string | null>(null);
  const { status, isLoading, refetch } = useBackendStatus();
  const { t } = useTranslation();

  const uiState = deriveUiState(status);

  // Detect successful connection after retry
  useEffect(() => {
    if (prevStateRef.current === "error" && uiState === "ready" && isRetrying === false) {
      setShowSuccess(true);
      // Haptic feedback on mobile devices
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]); // Short success pattern
      }
      toast.success(t("backendReconnected"));
      // Start dismiss animation after success
      setTimeout(() => {
        setIsDismissing(true);
      }, 1200);
      // Auto-dismiss drawer after animation completes
      setTimeout(() => {
        setShowSuccess(false);
        setIsDismissing(false);
        setOpen(false);
      }, 1800);
    }
    prevStateRef.current = uiState;
  }, [uiState, isRetrying, t]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await refetch();
    setTimeout(() => setIsRetrying(false), 600);
  }, [refetch]);

  const copyStatus = useCallback(async () => {
    const modeLabel = status.isMock ? t("previewModeLabel") : t("liveModeLabel");
    const backendLabel = isLoading 
      ? t("diagnosticsChecking") 
      : uiState === "error" 
        ? t("diagnosticsOffline") 
        : uiState === "connecting" 
          ? t("diagnosticsConnecting") 
          : t("diagnosticsOnline");
    const statusText = `${t("diagnosticsMode")}: ${modeLabel}, ${t("diagnosticsBackend")}: ${backendLabel}`;
    
    try {
      await navigator.clipboard.writeText(statusText);
      setCopied(true);
      toast.success(t("copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  }, [status.isMock, uiState, isLoading, t]);

  return {
    open,
    setOpen,
    copied,
    isRetrying,
    showSuccess,
    isDismissing,
    status,
    uiState, // Expose derived UI state
    isLoading,
    refetch,
    handleRetry,
    copyStatus,
    t,
  };
}
