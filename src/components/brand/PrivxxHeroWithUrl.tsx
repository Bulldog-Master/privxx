/**
 * PrivxxHeroWithUrl
 * 
 * Main hero component with URL input and connection controls.
 * Uses useConnectWithPolling for connect flow with /status polling.
 * Handles 403 session_locked by redirecting to unlock screen.
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import PrivxxLogo from "./PrivxxLogo";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Clock, LogIn, AlertTriangle, RefreshCw, Lock } from "lucide-react";
import { bridgeClient } from "@/api/bridge";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentity } from "@/features/identity/context/IdentityContext";
import { ConnectionStateIndicator } from "@/features/connection/components";
import { useConnectWithPolling } from "@/features/connection/hooks";

const PrivxxHeroWithUrl = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isLocked, isUnlocked, checkStatus: refreshIdentity, forceSetLocked } = useIdentity();
  const [url, setUrl] = useState("https://example.com");
  const [disconnecting, setDisconnecting] = useState(false);

  // If the user explicitly clicked Disconnect but status polling is stale/flaky,
  // keep the UI editable (don’t immediately lock the URL input again).
  const [manualDisconnectRequested, setManualDisconnectRequested] = useState(false);

  // Use the centralized backend status context for rate limiting and initial state only
  // Do NOT use it for /status polling during connect flow - useConnectWithPolling handles that
  const { status, isLoading: statusLoading, refetch: fetchStatus, rateLimit } = useBackendStatusContext();

  // Handle session_locked: immediately set identity to locked and show unlock screen
  const handleSessionLocked = useCallback(() => {
    // Force identity to locked state immediately (don't wait for checkStatus)
    forceSetLocked?.();
    // Also trigger a refresh to sync with backend
    refreshIdentity();
  }, [forceSetLocked, refreshIdentity]);

  // Connect with polling hook
  const {
    result: connectResult,
    connect,
    reset: resetConnect,
    isConnecting,
    isPolling,
    isSecure,
    isTimeout,
    isSessionLocked,
  } = useConnectWithPolling(handleSessionLocked);

  const currentState = status.state;
  const isConnectedFromStatus = currentState === "secure";
  const isIdle = currentState === "idle";
  const isError = currentState === "error";

  // Only clear the manual override once the backend confirms we're no longer secure.
  useEffect(() => {
    if (manualDisconnectRequested && currentState !== "secure") {
      setManualDisconnectRequested(false);
    }
  }, [manualDisconnectRequested, currentState]);

  const effectiveConnected = !manualDisconnectRequested && (isConnectedFromStatus || isSecure);

  // Determine display states
  const showRateLimited = rateLimit.isRateLimited;
  const showLoginRequired = status.lastErrorCode === "UNAUTHORIZED" && !user;
  const showTokenExpired = status.lastErrorCode === "UNAUTHORIZED" && user;
  const showError = isError && !showLoginRequired && !showTokenExpired && !showRateLimited;

  // Show unlock required if session is locked
  const showUnlockRequired = isLocked && user && !showRateLimited;

  const canConnect = url.trim().length > 8 && isIdle && !showRateLimited && user && isUnlocked && !isConnecting && !isPolling;
  const canDisconnect = effectiveConnected && !showRateLimited;

  const onConnect = async () => {
    if (!canConnect) return;
    setManualDisconnectRequested(false);
    await connect(url.trim());
  };

  const onDisconnect = async () => {
    if (!canDisconnect) return;
    setManualDisconnectRequested(true);
    setDisconnecting(true);
    try {
      await bridgeClient.disconnect();
    } catch (err) {
      console.error("[Bridge] Disconnect failed:", err);
    } finally {
      // Always reset local connect/polling UI so the URL field becomes editable.
      resetConnect();
      await fetchStatus().catch(() => {});
      setDisconnecting(false);
    }
  };

  // Use data from polling result if secure, otherwise from status context
  const displayState = isSecure ? connectResult.statusData?.state : currentState;
  const displayTargetUrl = isSecure ? connectResult.statusData?.targetUrl : url;
  const displaySessionId = isSecure ? connectResult.statusData?.sessionId : undefined;
  const displayLatency = isSecure ? connectResult.statusData?.latency : status.latencyMs;

  return (
    <div className="flex flex-col items-center text-center space-y-6 relative w-full max-w-md mx-auto">
      {/* Stylized Logo with custom mark */}
      <div className="hero">
        <div className="hero-ambient-dot" />
        <h1 className="flex items-baseline justify-center relative z-10">
          <PrivxxLogo size="lg" />
        </h1>
      </div>
      
      {/* Tagline */}
      <p className="text-primary/80 text-sm sm:text-base font-medium w-full text-center">
        {t("subtitle")}
      </p>

      {/* Connection State Indicator */}
      <ConnectionStateIndicator />

      {/* Rate Limit Banner */}
      {showRateLimited && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <Clock className="h-5 w-5 text-amber-500 animate-pulse" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {t("rateLimited", "Rate Limited")}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("retryIn", "Retry in")} {rateLimit.formattedTime}
            </p>
          </div>
          <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
            {rateLimit.formattedTime}
          </span>
        </div>
      )}

      {/* Unlock Required Banner - removed, handled by Index.tsx IdentityUnlockForm */}

      {/* Session Locked Banner (from 403 response) */}
      {isSessionLocked && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <Lock className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {t("sessionLocked", "Session locked — please unlock your identity")}
          </p>
        </div>
      )}

      {/* Login Required Banner */}
      {showLoginRequired && !showRateLimited && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
          <LogIn className="h-5 w-5 text-primary" />
          <p className="text-sm text-primary">
            {t("loginToConnect", "Log in to connect through the mixnet")}
          </p>
        </div>
      )}

      {/* Token Expired Banner */}
      {showTokenExpired && !showRateLimited && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {t("sessionExpired", "Session expired — please log in again")}
          </p>
        </div>
      )}

      {/* Timeout Banner */}
      {isTimeout && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              {t("connectionPending", "Connection pending")}
            </p>
            <p className="text-xs text-muted-foreground">
              {connectResult.error || t("tryAgain", "Please try again")}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetConnect()}
            className="h-7 px-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* Error Banner with Retry */}
      {showError && !showRateLimited && !isTimeout && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
          <p className="text-sm text-destructive flex-1">
            {t("connectionError", "Service temporarily unavailable")}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => fetchStatus()}
            disabled={statusLoading}
            className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${statusLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      )}

      {/* URL Input Bar */}
      <div className="w-full space-y-3">
        <div className="space-y-1">
          <input
            className="w-full rounded-lg border-2 border-primary/60 bg-background/50 backdrop-blur-sm px-4 py-3 min-h-[48px] text-base text-primary placeholder:text-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("urlPlaceholder") || "https://example.com"}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={effectiveConnected || isConnecting || isPolling || showRateLimited}
          />
        </div>

        {/* Primary action area (kept layout-stable to prevent flashing) */}
        {!effectiveConnected && (
          <Button
            className="min-h-[48px] w-full text-base font-medium px-6"
            disabled={!canConnect || statusLoading || isConnecting || isPolling}
            onClick={onConnect}
          >
            {(statusLoading || isConnecting || isPolling) ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            <span className="inline-flex items-center gap-1.5">
              <span>
                {isPolling 
                  ? t("connectingPolling", `Connecting (${connectResult.pollAttempt}/10)...`)
                  : isConnecting 
                    ? t("connecting", "Connecting...")
                    : t("connectThrough", "Connect through")
                }
              </span>
              {!isConnecting && !isPolling && <PrivxxLogo size="sm" brightenMark />}
            </span>
          </Button>
        )}

        {/* Connected State */}
        {effectiveConnected && !statusLoading && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <ShieldCheck className="h-5 w-5" />
                {t("tunnelConnected") || "Tunnel Active"}
              </div>
              
              {/* Session details */}
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>{t("state", "State")}:</span>
                  <span className="font-medium text-primary">{displayState}</span>
                </div>
                {displayTargetUrl && (
                  <div className="flex justify-between">
                    <span>{t("targetUrl", "Target")}:</span>
                    <span className="font-mono text-xs truncate max-w-[200px]">{displayTargetUrl}</span>
                  </div>
                )}
                {displaySessionId && (
                  <div className="flex justify-between">
                    <span>{t("sessionId", "Session")}:</span>
                    <span className="font-mono text-xs">{displaySessionId}</span>
                  </div>
                )}
                {displayLatency != null && (
                  <div className="flex justify-between">
                    <span>{t("latency", "Latency")}:</span>
                    <span className="font-mono">{displayLatency}ms</span>
                  </div>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              className="min-h-[48px] w-full"
              onClick={onDisconnect}
              disabled={disconnecting || showRateLimited}
            >
              {disconnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t("disconnect") || "Disconnect"}
            </Button>
          </div>
        )}
      </div>

      {/* Live mode indicator */}
      <p className="text-xs text-primary/60 max-w-sm">
        {t("liveMode", "Live mode — connected to real bridge infrastructure")}
      </p>
    </div>
  );
};

export default PrivxxHeroWithUrl;
