import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Activity, Server, Wifi, WifiOff, CheckCircle2, XCircle, RefreshCw, Loader2, AlertTriangle, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { bridgeClient } from "@/api/bridge";
import type { XxdkInfoResponse, CmixxStatusResponse, HealthResponse } from "@/api/bridge/types";

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

const BridgeLiveStatusCard = () => {
  const { t } = useTranslation();
  
  // Response time trackers
  const healthTimer = useResponseTime();
  const xxdkTimer = useResponseTime();
  const cmixxTimer = useResponseTime();

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

  // Fetch xxdk info with timing
  const { 
    data: xxdkInfo, 
    isLoading: xxdkLoading,
    isError: xxdkError,
    isFetching: xxdkFetching,
    refetch: refetchXxdk
  } = useQuery<XxdkInfoResponse>({
    queryKey: ["bridge-xxdk-info"],
    queryFn: async () => {
      xxdkTimer.startTimer();
      try {
        const result = await bridgeClient.xxdkInfo();
        xxdkTimer.endTimer();
        return result;
      } catch (e) {
        xxdkTimer.resetTimer();
        throw e;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  // Fetch cmixx status with timing
  const { 
    data: cmixxStatus, 
    isLoading: cmixxLoading,
    isError: cmixxError,
    isFetching: cmixxFetching,
    refetch: refetchCmixx
  } = useQuery<CmixxStatusResponse>({
    queryKey: ["bridge-cmixx-status"],
    queryFn: async () => {
      cmixxTimer.startTimer();
      try {
        const result = await bridgeClient.cmixxStatus();
        cmixxTimer.endTimer();
        return result;
      } catch (e) {
        cmixxTimer.resetTimer();
        throw e;
      }
    },
    refetchInterval: 30000,
    retry: 1,
  });

  const isLoading = healthLoading || xxdkLoading || cmixxLoading;
  const isFetching = healthFetching || xxdkFetching || cmixxFetching;
  const hasError = healthError || xxdkError || cmixxError;
  const allErrors = healthError && xxdkError && cmixxError;

  const handleRefresh = () => {
    refetchHealth();
    refetchXxdk();
    refetchCmixx();
  };

  const formatTimestamp = (ts?: number) => {
    if (!ts) return "—";
    const date = new Date(ts);
    return date.toLocaleTimeString();
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

        {/* xxDK Info */}
        <div className="space-y-1 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">/xxdk/info</p>
            <LatencyBadge latency={xxdkError ? null : xxdkTimer.latency} isLoading={xxdkFetching} />
          </div>
          {xxdkError ? (
            <ErrorState 
              endpoint="/xxdk/info" 
              onRetry={() => refetchXxdk()} 
              isRetrying={xxdkFetching}
            />
          ) : xxdkLoading ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : (
            <>
              <StatusRow
                label={t("mode")}
                value={xxdkInfo?.mode || "—"}
                icon={<Activity className="h-3.5 w-3.5" />}
                valueColor={xxdkInfo?.mode === "real" ? "text-emerald-500" : "text-blue-500"}
              />
              <StatusRow
                label={t("identity")}
                value={xxdkInfo?.hasIdentity ? t("present") : t("none")}
                icon={xxdkInfo?.hasIdentity ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                valueColor={xxdkInfo?.hasIdentity ? "text-emerald-500" : "text-muted-foreground"}
              />
              <StatusRow
                label={t("ready")}
                value={xxdkInfo?.ready ? t("yes") : t("no")}
                icon={xxdkInfo?.ready ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-amber-500" />}
                valueColor={xxdkInfo?.ready ? "text-emerald-500" : "text-amber-500"}
              />
              <StatusRow
                label={t("lastUpdate")}
                value={formatTimestamp(xxdkInfo?.timestamp)}
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </>
          )}
        </div>

        {/* cMixx Status */}
        <div className="space-y-1 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">/cmixx/status</p>
            <LatencyBadge latency={cmixxError ? null : cmixxTimer.latency} isLoading={cmixxFetching} />
          </div>
          {cmixxError ? (
            <ErrorState 
              endpoint="/cmixx/status" 
              onRetry={() => refetchCmixx()} 
              isRetrying={cmixxFetching}
            />
          ) : cmixxLoading ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : (
            <>
              <StatusRow
                label={t("mixnetConnection")}
                value={cmixxStatus?.connected ? t("connected") : t("disconnected")}
                icon={cmixxStatus?.connected ? <Wifi className="h-3.5 w-3.5 text-emerald-500" /> : <WifiOff className="h-3.5 w-3.5 text-amber-500" />}
                valueColor={cmixxStatus?.connected ? "text-emerald-500" : "text-amber-500"}
              />
              {cmixxStatus?.nodeCount !== undefined && (
                <StatusRow
                  label={t("nodes")}
                  value={String(cmixxStatus.nodeCount)}
                  icon={<Server className="h-3.5 w-3.5" />}
                />
              )}
              {cmixxStatus?.lastRoundId !== undefined && (
                <StatusRow
                  label={t("lastRound")}
                  value={String(cmixxStatus.lastRoundId)}
                  icon={<Activity className="h-3.5 w-3.5" />}
                />
              )}
              <StatusRow
                label={t("lastUpdate")}
                value={formatTimestamp(cmixxStatus?.timestamp)}
                icon={<Activity className="h-3.5 w-3.5" />}
              />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeLiveStatusCard;
