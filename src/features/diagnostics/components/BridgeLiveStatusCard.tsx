import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Activity,
  Server,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Timer,
  Globe,
  Network,
  Shield,
  Clock,
  Power,
  PowerOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bridgeClient, getBridgeUrl } from "@/api/bridge";
import { useBackendStatusShared } from "@/contexts/BackendStatusContext";
import type { BridgeUiStatus } from "@/api/bridge/statusUtils";
import type { HealthResponse } from "@/api/bridge/types";

interface StatusRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  valueColor?: string;
}

const StatusRow = ({ label, value, icon, valueColor = "text-foreground" }: StatusRowProps) => (
  <div className="flex items-center justify-between py-1.5">
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      {icon}
      <span>{label}</span>
    </div>
    <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
  </div>
);

interface LatencyBadgeProps {
  latency: number | null;
  isLoading?: boolean;
}

const LatencyBadge = ({ latency, isLoading }: LatencyBadgeProps) => {
  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted/50 text-muted-foreground">
        <Loader2 className="h-2.5 w-2.5 animate-spin" />
      </span>
    );
  }
  
  if (latency === null) return null;
  
  const getLatencyColor = (ms: number) => {
    if (ms < 200) return "text-emerald-500 bg-emerald-500/10";
    if (ms < 500) return "text-amber-500 bg-amber-500/10";
    return "text-destructive bg-destructive/10";
  };
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${getLatencyColor(latency)}`}>
      <Timer className="h-2.5 w-2.5" />
      {latency}ms
    </span>
  );
};

// Hook to track response time
const useResponseTime = () => {
  const startTimeRef = useRef<number>(0);
  const [latency, setLatency] = useState<number | null>(null);
  
  const startTimer = useCallback(() => {
    startTimeRef.current = performance.now();
  }, []);
  
  const endTimer = useCallback(() => {
    if (startTimeRef.current > 0) {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setLatency(elapsed);
      startTimeRef.current = 0;
    }
  }, []);
  
  const resetTimer = useCallback(() => {
    setLatency(null);
  }, []);
  
  return { latency, startTimer, endTimer, resetTimer };
};

// Helper to determine connection path type
const getConnectionPathInfo = (url: string) => {
  const isProxy = url.includes(":8090");
  const isBridge = url.includes(":8787");
  const isLocal = url.includes("127.0.0.1") || url.includes("localhost");
  
  if (isProxy) {
    return {
      type: "proxy" as const,
      label: "Proxy",
      port: "8090",
      visibility: isLocal ? "local" : "public",
    };
  }
  if (isBridge) {
    return {
      type: "bridge" as const,
      label: "Bridge",
      port: "8787",
      visibility: "local",
    };
  }
  return {
    type: "custom" as const,
    label: "Custom",
    port: new URL(url).port || "443",
    visibility: "public",
  };
};

// Rate limit countdown badge
const RateLimitBadge = ({ remainingSec, formattedTime }: { remainingSec: number; formattedTime: string }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/10 border border-amber-500/20">
    <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
    <div className="flex-1">
      <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Rate Limited</p>
      <p className="text-xs text-muted-foreground">Retry in {formattedTime}</p>
    </div>
    <span className="font-mono text-lg font-bold text-amber-600 dark:text-amber-400">
      {formattedTime}
    </span>
  </div>
);

// Status badge based on BridgeUiStatus
const StatusBadge = ({ status }: { status: BridgeUiStatus }) => {
  switch (status.kind) {
    case "ok":
      return (
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-medium">Online</span>
        </div>
      );
    case "token_invalid":
      return (
        <div className="flex items-center gap-2 text-destructive">
          <XCircle className="h-4 w-4" />
          <span className="text-sm font-medium">Session Expired</span>
        </div>
      );
    case "rate_limited":
      return (
        <div className="flex items-center gap-2 text-amber-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Rate Limited</span>
        </div>
      );
    case "error":
      return (
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">Error</span>
        </div>
      );
  }
};

const BridgeLiveStatusCard = () => {
  const { t } = useTranslation();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Get connection path info
  const bridgeUrl = getBridgeUrl();
  const connectionPath = getConnectionPathInfo(bridgeUrl);
  
  // Response time tracker for health
  const healthTimer = useResponseTime();
  
  // Shared backend status (single /status poller for the whole app)
  const {
    status: backendStatus,
    isLoading: backendLoading,
    refetch: refetchStatus,
    rateLimit,
  } = useBackendStatusShared();

  const statusUi: BridgeUiStatus = (() => {
    if (rateLimit.isRateLimited) {
      return { kind: "rate_limited", retryAfterSec: rateLimit.remainingSec, retryUntil: Date.now() + rateLimit.remainingSec * 1000 };
    }

    if (backendStatus.state === "idle" || backendStatus.state === "connecting" || backendStatus.state === "secure") {
      return { kind: "ok", state: backendStatus.state };
    }

    if (backendStatus.lastErrorCode === "UNAUTHORIZED") {
      return { kind: "token_invalid" };
    }

    return { kind: "error", message: backendStatus.lastErrorCode ?? "Error" };
  })();

  const statusLatency = backendStatus.latencyMs;
  const statusLoading = backendLoading;


  // Fetch bridge health with timing
  const { 
    data: health, 
    isLoading: healthLoading,
    isError: healthError,
    isFetching: healthFetching,
    refetch: refetchHealth
  } = useQuery<HealthResponse>({
    queryKey: ["bridge-health"],
    queryFn: async () => {
      healthTimer.startTimer();
      try {
        const result = await bridgeClient.health();
        healthTimer.endTimer();
        return result;
      } catch (e) {
        healthTimer.resetTimer();
        throw e;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const handleRefresh = () => {
    refetchHealth();
    if (!rateLimit.isRateLimited) {
      refetchStatus();
    }
  };

  // Connect handler
  const handleConnect = async () => {
    setConnecting(true);
    try {
      await bridgeClient.connect();
      refetchStatus(); // Refresh status after connect
    } catch (err) {
      console.error("[Bridge] Connect failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect handler
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await bridgeClient.disconnect();
      refetchStatus(); // Refresh status after disconnect
    } catch (err) {
      console.error("[Bridge] Disconnect failed:", err);
    } finally {
      setDisconnecting(false);
    }
  };

  const isLoading = healthLoading || statusLoading;
  const isFetching = healthFetching || statusLoading;
  const hasError = healthError || (statusUi?.kind === "error");
  const allErrors = healthError && statusUi?.kind === "error";

  const getStateDisplay = (state?: string) => {
    switch (state) {
      case "idle": return { label: t("stateIdle", "Idle"), color: "text-muted-foreground" };
      case "connecting": return { label: t("stateConnecting", "Connecting"), color: "text-amber-500" };
      case "secure": return { label: t("stateSecure", "Secure"), color: "text-emerald-500" };
      default: return { label: "—", color: "text-muted-foreground" };
    }
  };

  const currentState = statusUi?.kind === "ok" ? statusUi.state : undefined;
  const canConnect = statusUi?.kind === "ok" && currentState === "idle";
  const canDisconnect = statusUi?.kind === "ok" && (currentState === "connecting" || currentState === "secure");

  return (
    <Card className={`bg-card/50 border-border/50 ${hasError ? "border-destructive/30" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${hasError ? "bg-destructive/10" : "bg-primary/10"}`}>
              {hasError ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Activity className="h-4 w-4 text-primary" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-medium">{t("bridgeLiveStatus")}</h3>
              <p className="text-xs text-muted-foreground">
                {hasError 
                  ? t("bridgeConnectionIssues", "Connection issues detected")
                  : t("bridgeLiveStatusSubtext")
                }
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isFetching}
            className="h-7 w-7 p-0"
          >
            {isLoading || isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>

        {/* Connection Path Indicator */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 flex-1">
            {connectionPath.type === "proxy" || connectionPath.type === "custom" ? (
              <Globe className="h-4 w-4 text-primary" />
            ) : (
              <Network className="h-4 w-4 text-amber-500" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium">
                {t("connectionPath", "Connection Path")}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                {bridgeUrl}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
              connectionPath.type === "proxy" || connectionPath.type === "custom"
                ? "bg-primary/10 text-primary" 
                : "bg-amber-500/10 text-amber-500"
            }`}>
              {connectionPath.label}:{connectionPath.port}
            </span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] ${
              connectionPath.visibility === "public"
                ? "bg-emerald-500/10 text-emerald-500"
                : "bg-muted text-muted-foreground"
            }`}>
              {connectionPath.visibility === "public" 
                ? t("public", "Public") 
                : t("local", "Local")}
            </span>
          </div>
        </div>

        {/* Rate Limit Banner */}
        {rateLimit.isRateLimited && (
          <RateLimitBadge 
            remainingSec={rateLimit.remainingSec} 
            formattedTime={rateLimit.formattedTime} 
          />
        )}

        {/* All endpoints failed banner */}
        {allErrors && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">
                {t("bridgeUnreachable", "Bridge Unreachable")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("bridgeUnreachableDesc", "Unable to connect to the bridge API. Check if the bridge server is running.")}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="shrink-0 border-destructive/30 hover:bg-destructive/10"
            >
              {isFetching ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                  {t("retryAll", "Retry All")}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Health Status */}
        <div className="space-y-1 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">/health</p>
            <LatencyBadge latency={healthError ? null : healthTimer.latency} isLoading={healthFetching} />
          </div>
          {healthError ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              <span>{t("connectionFailed", "Connection Failed")}</span>
            </div>
          ) : healthLoading ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : (
            <>
              <StatusRow
                label={t("service")}
                value={health?.service || "—"}
                icon={<Server className="h-3.5 w-3.5" />}
              />
              <StatusRow
                label={t("version")}
                value={health?.version || "—"}
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </>
          )}
        </div>

        {/* Bridge Status (Authenticated) */}
        <div className="space-y-1 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">/status</p>
            <div className="flex items-center gap-2">
              {statusUi && <StatusBadge status={statusUi} />}
              <LatencyBadge latency={statusLoading ? null : statusLatency} isLoading={statusLoading} />
            </div>
          </div>
          
          {statusLoading ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : statusUi?.kind === "ok" ? (
            <>
              <StatusRow
                label={t("connectionState", "State")}
                value={getStateDisplay(statusUi.state).label}
                icon={<Shield className="h-3.5 w-3.5" />}
                valueColor={getStateDisplay(statusUi.state).color}
              />
              {statusUi.state === "secure" && (
                <StatusRow
                  label={t("authStatus", "Auth")}
                  value={t("authenticated", "Authenticated")}
                  icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  valueColor="text-emerald-500"
                />
              )}
            </>
          ) : statusUi?.kind === "token_invalid" ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-destructive">
              <XCircle className="h-3.5 w-3.5" />
              <span>Session expired — please log in again</span>
            </div>
          ) : statusUi?.kind === "rate_limited" ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-amber-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Rate limited — waiting for countdown</span>
            </div>
          ) : statusUi?.kind === "error" ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{statusUi.message || "Unknown error"}</span>
            </div>
          ) : null}
        </div>

        {/* Connect/Disconnect Buttons */}
        <div className="flex gap-2 pt-2 border-t border-border/30">
          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={!canConnect || connecting || rateLimit.isRateLimited}
            className="flex-1"
          >
            {connecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Connect
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={!canDisconnect || disconnecting || rateLimit.isRateLimited}
            className="flex-1"
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <PowerOff className="h-4 w-4 mr-2" />
            )}
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeLiveStatusCard;
