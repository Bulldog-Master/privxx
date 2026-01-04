import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Activity, Server, CheckCircle2, XCircle, RefreshCw, Loader2, AlertTriangle, Timer, Globe, Network, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bridgeClient, getBridgeUrl } from "@/api/bridge";
import type { StatusResponse, HealthResponse } from "@/api/bridge/types";

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

interface ErrorStateProps {
  endpoint: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

const ErrorState = ({ endpoint, onRetry, isRetrying }: ErrorStateProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-destructive/10 border border-destructive/20">
      <div className="flex items-center gap-2">
        <XCircle className="h-4 w-4 text-destructive" />
        <div>
          <p className="text-sm font-medium text-destructive">{t("connectionFailed", "Connection Failed")}</p>
          <p className="text-xs text-muted-foreground">{t("unableToReach", "Unable to reach")} {endpoint}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        disabled={isRetrying}
        className="h-7 px-2 text-xs border-destructive/30 hover:bg-destructive/10"
      >
        {isRetrying ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            {t("retry")}
          </>
        )}
      </Button>
    </div>
  );
};

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

const BridgeLiveStatusCard = () => {
  const { t } = useTranslation();
  
  // Get connection path info
  const bridgeUrl = getBridgeUrl();
  const connectionPath = getConnectionPathInfo(bridgeUrl);
  
  // Response time trackers
  const healthTimer = useResponseTime();
  const statusTimer = useResponseTime();

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

  // Fetch bridge status with timing (requires auth)
  const { 
    data: statusData, 
    isLoading: statusLoading,
    isError: statusError,
    isFetching: statusFetching,
    refetch: refetchStatus
  } = useQuery<StatusResponse>({
    queryKey: ["bridge-status"],
    queryFn: async () => {
      statusTimer.startTimer();
      try {
        const result = await bridgeClient.status();
        statusTimer.endTimer();
        return result;
      } catch (e) {
        statusTimer.resetTimer();
        throw e;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const isLoading = healthLoading || statusLoading;
  const isFetching = healthFetching || statusFetching;
  const hasError = healthError || statusError;
  const allErrors = healthError && statusError;

  const handleRefresh = () => {
    refetchHealth();
    refetchStatus();
  };

  const getStateDisplay = (state?: string) => {
    switch (state) {
      case "idle": return { label: t("stateIdle", "Idle"), color: "text-muted-foreground" };
      case "connecting": return { label: t("stateConnecting", "Connecting"), color: "text-amber-500" };
      case "secure": return { label: t("stateSecure", "Secure"), color: "text-emerald-500" };
      default: return { label: "—", color: "text-muted-foreground" };
    }
  };

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
            <ErrorState 
              endpoint="/health" 
              onRetry={() => refetchHealth()} 
              isRetrying={healthFetching}
            />
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
            <LatencyBadge latency={statusError ? null : statusTimer.latency} isLoading={statusFetching} />
          </div>
          {statusError ? (
            <ErrorState 
              endpoint="/status" 
              onRetry={() => refetchStatus()} 
              isRetrying={statusFetching}
            />
          ) : statusLoading ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : (
            <>
              <StatusRow
                label={t("connectionState", "State")}
                value={getStateDisplay(statusData?.state).label}
                icon={<Shield className="h-3.5 w-3.5" />}
                valueColor={getStateDisplay(statusData?.state).color}
              />
              {statusData?.state === "secure" && (
                <StatusRow
                  label={t("authStatus", "Auth")}
                  value={t("authenticated", "Authenticated")}
                  icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                  valueColor="text-emerald-500"
                />
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeLiveStatusCard;
