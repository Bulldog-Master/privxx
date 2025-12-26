import { useState, useEffect, useRef, useCallback } from "react";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";

export function useDiagnosticsState() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);
  const prevStateRef = useRef<string | null>(null);
  const { status, isLoading, refetch } = useBackendStatus();
  const { t } = useTranslations();

  // Detect successful connection after retry
  useEffect(() => {
    if (prevStateRef.current === "error" && status.state === "ready" && isRetrying === false) {
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
    prevStateRef.current = status.state;
  }, [status.state, isRetrying, t]);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    await refetch();
    setTimeout(() => setIsRetrying(false), 600);
  }, [refetch]);

  const copyStatus = useCallback(async () => {
    const modeLabel = status.isMock ? t("previewModeLabel") : t("liveModeLabel");
    const backendLabel = isLoading 
      ? t("diagnosticsChecking") 
      : status.state === "error" 
        ? t("diagnosticsOffline") 
        : status.state === "starting" 
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
  }, [status.isMock, status.state, isLoading, t]);

  return {
    open,
    setOpen,
    copied,
    isRetrying,
    showSuccess,
    isDismissing,
    status,
    isLoading,
    refetch,
    handleRetry,
    copyStatus,
    t,
  };
}
