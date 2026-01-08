/**
 * Bridge Connectivity Warning
 * 
 * Monitors bridge connectivity and shows a warning banner when unreachable.
 * Provides helpful suggestions for troubleshooting with auto-retry.
 * 
 * STABILITY: Uses a debounced show/hide to prevent flickering during
 * transient network issues or polling cycles.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, WifiOff, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { isMockMode } from "@/api/bridge";
import { cn } from "@/lib/utils";

interface BridgeConnectivityWarningProps {
  /** Minimum failures before showing warning */
  minFailures?: number;
  /** Show in mock mode (usually not needed) */
  showInMockMode?: boolean;
}

const AUTO_RETRY_DELAY_MS = 15000; // 15 seconds
const SHOW_DEBOUNCE_MS = 1500; // Debounce before showing to prevent flicker
const HIDE_DEBOUNCE_MS = 500; // Quick hide on recovery

export function BridgeConnectivityWarning({
  minFailures = 2,
  showInMockMode = false,
}: BridgeConnectivityWarningProps) {
  const { t } = useTranslation();
  const { status, refetch, isLoading, autoRetry } = useBackendStatusContext();
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [localCountdown, setLocalCountdown] = useState<number | null>(null);
  
  // Debounced visibility state to prevent flickering
  const [visible, setVisible] = useState(false);
  const showTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if warning should be shown (raw, before debounce)
  const shouldShow = 
    !dismissed &&
    status.failureCount >= minFailures &&
    status.health !== "healthy" &&
    (showInMockMode || !isMockMode());

  // Debounced visibility control
  useEffect(() => {
    if (shouldShow) {
      // Clear any pending hide
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      // If not already visible, debounce the show
      if (!visible && !showTimeoutRef.current) {
        showTimeoutRef.current = setTimeout(() => {
          setVisible(true);
          showTimeoutRef.current = null;
        }, SHOW_DEBOUNCE_MS);
      }
    } else {
      // Clear any pending show
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current);
        showTimeoutRef.current = null;
      }
      // If visible, debounce the hide (shorter for snappy recovery feedback)
      if (visible && !hideTimeoutRef.current) {
        hideTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          hideTimeoutRef.current = null;
        }, HIDE_DEBOUNCE_MS);
      }
    }

    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [shouldShow, visible]);

  // Start local countdown when bridge becomes unreachable and visible
  useEffect(() => {
    if (visible && status.health === "offline" && status.failureCount >= minFailures) {
      setLocalCountdown(AUTO_RETRY_DELAY_MS / 1000);
    } else if (status.health === "healthy") {
      setLocalCountdown(null);
    }
  }, [visible, status.health, status.failureCount, minFailures]);

  // Countdown timer for auto-retry
  useEffect(() => {
    if (localCountdown === null || localCountdown <= 0) return;
    
    const interval = setInterval(() => {
      setLocalCountdown(prev => {
        if (prev === null || prev <= 1) {
          // Auto-retry when countdown reaches 0
          handleRetry();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [localCountdown]);

  // Reset dismissed state when connection recovers
  useEffect(() => {
    if (status.health === "healthy") {
      setDismissed(false);
    }
  }, [status.health]);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    setLocalCountdown(null);
    await refetch();
    setRetrying(false);
    // If still failing, restart countdown
    if (status.health === "offline") {
      setLocalCountdown(AUTO_RETRY_DELAY_MS / 1000);
    }
  }, [refetch, status.health]);

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  const countdownProgress = localCountdown !== null 
    ? ((AUTO_RETRY_DELAY_MS / 1000 - localCountdown) / (AUTO_RETRY_DELAY_MS / 1000)) * 100 
    : 0;

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "relative mb-4 border-destructive/50 bg-destructive/10",
        "animate-fade-in"
      )}
    >
      <WifiOff className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {t("bridgeWarning.title", "Service Temporarily Unavailable")}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {t("bridgeWarning.description", "Unable to reach the privacy service. Please check your connection.")}
        </p>
        
        {/* Auto-retry countdown */}
        {localCountdown !== null && localCountdown > 0 && !retrying && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t("bridgeWarning.autoRetry", "Auto-retry in")}</span>
              <span className="font-mono font-medium">{localCountdown}s</span>
            </div>
            <Progress value={countdownProgress} className="h-1" />
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={retrying || isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${retrying ? "animate-spin" : ""}`} />
            {retrying 
              ? t("bridgeWarning.retrying", "Retrying...") 
              : t("bridgeWarning.retryNow", "Retry Now")}
          </Button>
        </div>

        {/* Error details for debugging */}
        {status.lastErrorCode && (
          <p className="text-xs text-muted-foreground/70 font-mono">
            {status.lastErrorCode}
            {status.failureCount > 1 && ` · ${status.failureCount} ${t("bridgeWarning.attempts", "attempts")}`}
          </p>
        )}
      </AlertDescription>

      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">{t("dismiss", "Dismiss")}</span>
      </Button>
    </Alert>
  );
}