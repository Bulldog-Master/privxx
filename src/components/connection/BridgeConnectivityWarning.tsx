/**
 * Bridge Connectivity Warning
 * 
 * Monitors bridge connectivity and shows a warning banner when unreachable.
 * Provides helpful suggestions for troubleshooting.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, RefreshCw, ExternalLink, X, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { isMockMode, getBridgeUrl } from "@/api/bridge";

interface BridgeConnectivityWarningProps {
  /** Minimum failures before showing warning */
  minFailures?: number;
  /** Show in mock mode (usually not needed) */
  showInMockMode?: boolean;
}

function SimulatedNetworkInitializingNotice() {
  const { t } = useTranslation();

  return (
    <Alert className="relative mb-4 border-amber-500/30 bg-amber-500/10">
      <Clock className="h-4 w-4 text-amber-500" />
      <AlertTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
        {t("simulatedMode.title", "Network Initializing")}
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
          {t(
            "simulatedMode.description",
            "xxDK not connected — waiting for backend integration"
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
}

function LiveBridgeConnectivityWarning({
  minFailures,
  showInMockMode,
}: Required<Pick<BridgeConnectivityWarningProps, "minFailures" | "showInMockMode">>) {
  const { t } = useTranslation();
  const { status, refetch, isLoading } = useBackendStatus(15000); // Check every 15s
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  // Reset dismissed state when connection recovers
  useEffect(() => {
    if (status.health === "healthy") {
      setDismissed(false);
    }
  }, [status.health]);

  // Don't show in mock mode unless explicitly requested
  if (isMockMode() && !showInMockMode) {
    return null;
  }

  // Don't show if dismissed or not enough failures
  if (dismissed || status.failureCount < minFailures) {
    return null;
  }

  // Don't show if healthy
  if (status.health === "healthy") {
    return null;
  }

  const handleRetry = async () => {
    setRetrying(true);
    await refetch();
    setRetrying(false);
  };

  const bridgeUrl = getBridgeUrl();
  const isHttps = bridgeUrl.startsWith("https://");

  return (
    <Alert variant="destructive" className="relative mb-4 border-destructive/50 bg-destructive/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {t("bridgeWarning.title", "Bridge Unreachable")}
      </AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {t(
            "bridgeWarning.description",
            "Unable to connect to the privacy bridge. Your connection is not protected."
          )}
        </p>

        {/* Suggestions based on HTTPS vs HTTP */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">{t("bridgeWarning.suggestions", "Possible causes:")}</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            {isHttps ? (
              <>
                <li>{t("bridgeWarning.tlsNotConfigured", "TLS certificate not configured on server")}</li>
                <li>{t("bridgeWarning.dnsNotResolved", "Domain DNS not pointing to server")}</li>
                <li>{t("bridgeWarning.reverseProxyDown", "Reverse proxy (nginx/Caddy) not running")}</li>
              </>
            ) : (
              <>
                <li>{t("bridgeWarning.serverDown", "Bridge server is not running")}</li>
                <li>{t("bridgeWarning.firewallBlocking", "Firewall blocking connection")}</li>
              </>
            )}
            <li>{t("bridgeWarning.networkIssue", "Network connectivity issue")}</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            disabled={retrying || isLoading}
            className="h-8"
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${retrying ? "animate-spin" : ""}`} />
            {t("retry", "Retry")}
          </Button>

          <Button variant="ghost" size="sm" asChild className="h-8">
            <a
              href="https://docs.lovable.dev/features/security"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              {t("bridgeWarning.docs", "Setup Guide")}
            </a>
          </Button>
        </div>

        {/* Error details for debugging */}
        {status.lastErrorCode && (
          <p className="text-xs text-muted-foreground/70 font-mono">
            {t("bridgeWarning.errorCode", "Error")}: {status.lastErrorCode}
            {status.failureCount > 1 &&
              ` (${status.failureCount} ${t("bridgeWarning.failures", "failures")})`}
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

export function BridgeConnectivityWarning({
  minFailures = 2,
  showInMockMode = false,
}: BridgeConnectivityWarningProps) {
  const { isSimulated } = useBridgeHealthStatus();

  // When xxdk isn't ready, avoid /status polling + retry loops.
  if (isSimulated) {
    return <SimulatedNetworkInitializingNotice />;
  }

  return (
    <LiveBridgeConnectivityWarning minFailures={minFailures} showInMockMode={showInMockMode} />
  );
}

