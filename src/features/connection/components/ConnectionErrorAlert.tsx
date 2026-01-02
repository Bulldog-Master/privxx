/**
 * ConnectionErrorAlert
 * 
 * Displays connection errors with retry functionality.
 * Shows user-friendly error messages based on error codes.
 */

import { AlertCircle, RefreshCw, WifiOff, Clock, ServerCrash } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { ConnectErrorCode } from "../types";

interface ConnectionErrorAlertProps {
  errorCode?: ConnectErrorCode;
  errorMessage?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  isRetrying?: boolean;
}

export function ConnectionErrorAlert({
  errorCode,
  errorMessage,
  onRetry,
  onDismiss,
  isRetrying = false,
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
        };
      case "TIMEOUT":
        return {
          icon: Clock,
          title: t("connection.error.timeout", "Connection Timeout"),
          description: t(
            "connection.error.timeoutDesc",
            "The connection took too long. The network may be busy."
          ),
        };
      case "SERVER_BUSY":
        return {
          icon: ServerCrash,
          title: t("connection.error.serverBusy", "Server Busy"),
          description: t(
            "connection.error.serverBusyDesc",
            "The privacy network is currently at capacity. Please try again shortly."
          ),
        };
      case "INVALID_URL":
        return {
          icon: AlertCircle,
          title: t("connection.error.invalidUrl", "Invalid URL"),
          description: t(
            "connection.error.invalidUrlDesc",
            "Please enter a valid website address."
          ),
        };
      case "INVALID_MESSAGE":
        return {
          icon: AlertCircle,
          title: t("connection.error.protocol", "Protocol Error"),
          description: t(
            "connection.error.protocolDesc",
            "There was a communication error. Please try again."
          ),
        };
      default:
        return {
          icon: AlertCircle,
          title: t("connection.error.generic", "Connection Failed"),
          description:
            errorMessage ||
            t("connection.error.genericDesc", "Unable to establish a secure connection."),
        };
    }
  };

  const display = getErrorDisplay();
  const Icon = display.icon;

  return (
    <Alert variant="destructive" className="relative">
      <Icon className="h-4 w-4" />
      <AlertTitle>{display.title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm opacity-90">{display.description}</p>

        <div className="flex gap-2 mt-4">
          {onRetry && (
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
          {onDismiss && (
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
