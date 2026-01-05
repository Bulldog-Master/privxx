import { useState } from "react";
import { useTranslation } from "react-i18next";
import PrivxxLogo from "./PrivxxLogo";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Clock, LogIn, AlertTriangle } from "lucide-react";
import { bridgeClient } from "@/api/bridge";
import { useAuth } from "@/contexts/AuthContext";
import { useBackendStatus } from "@/hooks/useBackendStatus";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import SimulatedModeBanner from "@/components/connection/SimulatedModeBanner";

const PrivxxHeroWithUrl = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { status, isLoading: statusLoading, refetch, rateLimit } = useBackendStatus();
  const { isSimulated } = useBridgeHealthStatus();

  const [url, setUrl] = useState("https://");
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const currentState = status.state;
  const isConnected = currentState === "secure";
  const isConnecting = currentState === "connecting";
  const isIdle = currentState === "idle";

  const showRateLimited = rateLimit.isRateLimited;
  const showLoginRequired = !user;
  const showError = status.state === "error";

  // Disable connect when simulated (xxdkReady=false)
  const canConnect = url.trim().length > 8 && isIdle && !showRateLimited && !!user && !isSimulated;
  const canDisconnect = (isConnected || isConnecting) && !showRateLimited;

  const onConnect = async () => {
    if (!canConnect) return;
    setConnecting(true);
    try {
      await bridgeClient.connect();
      refetch();
    } catch (err) {
      console.error("[Bridge] Connect failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  const onDisconnect = async () => {
    if (!canDisconnect) return;
    setDisconnecting(true);
    try {
      await bridgeClient.disconnect();
      refetch();
    } catch (err) {
      console.error("[Bridge] Disconnect failed:", err);
    } finally {
      setDisconnecting(false);
    }
  };

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

      {/* Simulated Mode Banner - when xxdkReady=false */}
      <SimulatedModeBanner />

      {/* Rate Limit Banner */}
      {showRateLimited && !isSimulated && (
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

      {/* Login Required Banner */}
      {showLoginRequired && !showRateLimited && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
          <LogIn className="h-5 w-5 text-primary" />
          <p className="text-sm text-primary">
            {t("loginToConnect", "Log in to connect through the mixnet")}
          </p>
        </div>
      )}

      {/* Error Banner */}
      {showError && !showRateLimited && !showLoginRequired && (
        <div className="w-full flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">
            {t("unknownError", "Unknown error")}
          </p>
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
            disabled={isConnected || isConnecting || showRateLimited}
          />
        </div>

        {/* Idle / Connect State */}
        {(isIdle || statusLoading || showLoginRequired || showError) && !isConnected && !isConnecting && (
          <Button
            className="min-h-[48px] w-full text-base font-medium px-6"
            disabled={!canConnect || statusLoading || connecting}
            onClick={onConnect}
          >
            {statusLoading || connecting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <span>{t("connectThrough") || "Connect through"}</span>
              <PrivxxLogo size="sm" brightenMark />
            </span>
          </Button>
        )}

        {/* Connecting State */}
        {isConnecting && !statusLoading && (
          <Button className="min-h-[48px] w-full text-base" disabled>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("tunnelConnecting") || "Routing through mixnet…"}
          </Button>
        )}

        {/* Connected State */}
        {isConnected && !statusLoading && (
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                <ShieldCheck className="h-5 w-5" />
                {t("tunnelConnected") || "Tunnel Active"}
              </div>
              {typeof status.latencyMs === "number" && (
                <div className="text-sm text-muted-foreground">
                  {t("tunnelLatency") || "Latency"}: {status.latencyMs}ms
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {t("tunnelTarget") || "Target"}: {url}
              </div>
            </div>
            <Button
              variant="outline"
              className="min-h-[48px] w-full"
              onClick={onDisconnect}
              disabled={disconnecting || showRateLimited}
            >
              {disconnecting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
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

