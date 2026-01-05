import { useState, useRef, useCallback, type ReactNode } from "react";
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
import type { HealthResponse } from "@/api/bridge/types";
import { useBackendStatus } from "@/hooks/useBackendStatus";

interface StatusRowProps {
  label: string;
  value: string;
  icon: ReactNode;
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
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono ${getLatencyColor(
        latency
      )}`}
    >
      <Timer className="h-2.5 w-2.5" />
      {latency}ms
    </span>
  );
};

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

  // Defensive parse: env overrides may omit protocol and would crash render.
  try {
    const parsed = new URL(url);
    return {
      type: "custom" as const,
      label: "Custom",
      port: parsed.port || (parsed.protocol === "http:" ? "80" : "443"),
      visibility: "public",
    };
  } catch {
    return {
      type: "custom" as const,
      label: "Custom",
      port: "—",
      visibility: "public",
    };
  }
};

const RateLimitBadge = ({ formattedTime }: { formattedTime: string }) => (
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

const BridgeLiveStatusCard = () => {
  const { t } = useTranslation();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const { status, isLoading: statusLoading, refetch: refetchStatus, rateLimit } = useBackendStatus();

  const bridgeUrl = getBridgeUrl();
  const connectionPath = getConnectionPathInfo(bridgeUrl);

  const healthTimer = useResponseTime();

  const {
    data: health,
    isLoading: healthLoading,
    isError: healthError,
    isFetching: healthFetching,
    refetch: refetchHealth,
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
    refetchStatus();
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await bridgeClient.connect();
      refetchStatus();
    } catch (err) {
      console.error("[Bridge] Connect failed:", err);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await bridgeClient.disconnect();
      refetchStatus();
    } catch (err) {
      console.error("[Bridge] Disconnect failed:", err);
    } finally {
      setDisconnecting(false);
    }
  };

  const isLoading = healthLoading || statusLoading;
  const isFetching = healthFetching || statusLoading;
  const hasError = healthError || status.state === "error";

  const getStateDisplay = (state?: string) => {
    switch (state) {
      case "idle":
        return { label: t("stateIdle", "Idle"), color: "text-muted-foreground" };
      case "connecting":
        return { label: t("stateConnecting", "Connecting"), color: "text-amber-500" };
      case "secure":
        return { label: t("stateSecure", "Secure"), color: "text-emerald-500" };
      default:
        return { label: "—", color: "text-muted-foreground" };
    }
  };

  const canConnect = status.state === "idle";
  const canDisconnect = status.state === "connecting" || status.state === "secure";

  return (
    <Card className={`bg-card/50 border-border/50 ${hasError ? "border-destructive/30" : ""}`}>
      <CardContent className="p-4 space-y-3">
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
                  : t("bridgeLiveStatusSubtext")}
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

        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 flex-1">
            {connectionPath.type === "proxy" || connectionPath.type === "custom" ? (
              <Globe className="h-4 w-4 text-primary" />
            ) : (
              <Network className="h-4 w-4 text-amber-500" />
            )}
            <div className="flex flex-col">
              <span className="text-xs font-medium">{t("connectionPath", "Connection Path")}</span>
              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">
                {bridgeUrl}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                connectionPath.type === "proxy" || connectionPath.type === "custom"
                  ? "bg-primary/10 text-primary"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {connectionPath.label}:{connectionPath.port}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                connectionPath.visibility === "public"
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {connectionPath.visibility === "public" ? t("public", "Public") : t("local", "Local")}
            </span>
          </div>
        </div>

        {rateLimit.isRateLimited && <RateLimitBadge formattedTime={rateLimit.formattedTime} />}

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
              <StatusRow label={t("service")} value={health?.service || "—"} icon={<Server className="h-3.5 w-3.5" />} />
              <StatusRow label={t("version")} value={health?.version || "—"} icon={<Activity className="h-3.5 w-3.5" />} />
            </>
          )}
        </div>

        <div className="space-y-1 pt-2 border-t border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">/status</p>
            <LatencyBadge latency={statusLoading ? null : status.latencyMs} isLoading={statusLoading} />
          </div>

          {statusLoading ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>{t("loading")}</span>
            </div>
          ) : status.state === "error" ? (
            <div className="flex items-center gap-2 py-1.5 text-sm text-destructive">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{t("unknownError", "Unknown error")}</span>
            </div>
          ) : (
            <>
              <StatusRow
                label={t("connectionState", "State")}
                value={getStateDisplay(status.state).label}
                icon={<Shield className="h-3.5 w-3.5" />}
                valueColor={getStateDisplay(status.state).color}
              />
              {status.state === "secure" && (
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

        <div className="pt-3 border-t border-border/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!canConnect || connecting || rateLimit.isRateLimited}
              onClick={handleConnect}
            >
              {connecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Power className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t("connect", "Connect")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={!canDisconnect || disconnecting || rateLimit.isRateLimited}
              onClick={handleDisconnect}
            >
              {disconnecting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <PowerOff className="h-3.5 w-3.5 mr-1.5" />
              )}
              {t("disconnect", "Disconnect")}
            </Button>
          </div>
          {(status.state === "secure" || status.state === "connecting") && (
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{t("live", "Live")}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BridgeLiveStatusCard;
