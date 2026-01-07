/**
 * ConnectionErrorAlert
 * 
 * Displays connection errors with auto-retry countdown and manual retry.
 * Shows user-friendly error messages based on error codes.
 */

import { AlertCircle, RefreshCw, WifiOff, Clock, ServerCrash, Timer } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import type { ConnectErrorCode } from "../types";

interface ConnectionErrorAlertProps {
  errorCode?: ConnectErrorCode;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
  /** Auto-retry state */
  autoRetry?: {
    isWaiting: boolean;
    remainingSec: number;
    formattedTime: string;
    attempt: number;
    maxRetries: number;
    isExhausted: boolean;
    onRetryNow?: () => void;
    onCancel?: () => void;
  };
}

export function ConnectionErrorAlert({
  errorCode,
  errorMessage,
  onRetry,
  onDismiss,
  isRetrying = false,
  autoRetry,
}: ConnectionErrorAlertProps) {
  const { t } = useTranslation();

  // Get icon and styling based on error type
  const getErrorDisplay = () => {
    switch (errorCode) {
      case "NETWORK_ERROR":
        return {
          icon: WifiOff,
          title: t("connection.error.network", "Network Error"),
          description: t(
            "connection.error.networkDesc",
            "Unable to reach the privacy network. Check your internet connection."
          ),
          canAutoRetry: true,
        };
      case "TIMEOUT":
        return {
          icon: Clock,
          title: t("connection.error.timeout", "Connection Timeout"),
          description: t(
            "connection.error.timeoutDesc",
            "The connection took too long. The network may be busy."
          ),
          canAutoRetry: true,
        };
      case "SERVER_BUSY":
        return {
          icon: ServerCrash,
          title: t("connection.error.serverBusy", "Server Busy"),
          description: t(
            "connection.error.serverBusyDesc",
            "The privacy network is currently at capacity. Please try again shortly."
          ),
          canAutoRetry: true,
        };
      case "INVALID_URL":
        return {
          icon: AlertCircle,
          title: t("connection.error.invalidUrl", "Invalid URL"),
          description: t(
            "connection.error.invalidUrlDesc",
            "Please enter a valid website address."
          ),
          canAutoRetry: false,
        };
      case "INVALID_MESSAGE":
        return {
          icon: AlertCircle,
          title: t("connection.error.protocol", "Protocol Error"),
          description: t(
            "connection.error.protocolDesc",
            "There was a communication error. Please try again."
          ),
          canAutoRetry: false,
        };
      default:
        return {
          icon: AlertCircle,
          title: t("connection.error.generic", "Connection Failed"),
          description:
            errorMessage ||
            t("connection.error.genericDesc", "Unable to establish a secure connection."),
          canAutoRetry: true,
        };
    }
  };

  const display = getErrorDisplay();
  const Icon = display.icon;
  
  const showAutoRetry = autoRetry && display.canAutoRetry && !autoRetry.isExhausted;
  const isAutoRetrying = showAutoRetry && autoRetry.isWaiting;
  
  // Calculate progress percentage (countdown visual)
  const progressPercent = isAutoRetrying 
    ? Math.max(0, (autoRetry.remainingSec / 30) * 100) // Assuming max 30s countdown
    : 0;

  return (
    <Alert variant="destructive" className="relative">
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {display.title}
        {autoRetry && !autoRetry.isExhausted && (
          <span className="text-xs font-normal opacity-70">
            ({t("connection.error.attempt", "Attempt {{current}} of {{max}}", {
              current: autoRetry.attempt,
              max: autoRetry.maxRetries,
            })})
          </span>
        )}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm opacity-90">{display.description}</p>

        {/* Auto-retry countdown */}
        {isAutoRetrying && (
          <div className="mt-3 p-3 bg-background/50 rounded-md border border-border/50">
            <div className="flex items-center gap-2 text-sm mb-2">
              <Timer className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {t("connection.error.autoRetrying", "Retrying in")}
              </span>
              <span className="font-mono font-semibold text-foreground">
                {autoRetry.formattedTime}
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}
        
        {/* Exhausted retries message */}
        {autoRetry?.isExhausted && (
          <div className="mt-3 p-3 bg-destructive/10 rounded-md border border-destructive/20">
            <p className="text-sm text-destructive-foreground">
              {t(
                "connection.error.retriesExhausted",
                "Automatic retries exhausted. Please check your connection and try manually."
              )}
            </p>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {/* Retry Now button (skips countdown) */}
          {isAutoRetrying && autoRetry.onRetryNow && (
            <Button
              variant="default"
              size="sm"
              onClick={autoRetry.onRetryNow}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {t("connection.error.retryNow", "Retry Now")}
            </Button>
          )}
          
          {/* Standard retry button (when not auto-retrying) */}
          {onRetry && !isAutoRetrying && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              disabled={isRetrying}
              className="gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
              {isRetrying
                ? t("connection.error.retrying", "Retrying...")
                : t("connection.error.retry", "Try Again")}
            </Button>
          )}
          
          {/* Cancel auto-retry */}
          {isAutoRetrying && autoRetry.onCancel && (
            <Button variant="ghost" size="sm" onClick={autoRetry.onCancel}>
              {t("common.cancel", "Cancel")}
            </Button>
          )}
          
          {/* Dismiss (when not auto-retrying) */}
          {onDismiss && !isAutoRetrying && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              {t("common.dismiss", "Dismiss")}
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

export default ConnectionErrorAlert;
