import { useState, useMemo, useCallback, forwardRef, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { 
  X, Copy, RefreshCw, Gauge, Check, ChevronDown, ChevronUp,
  Monitor, Server, Wifi, Shield, Key, ShieldCheck, AlertCircle, Clock, RotateCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { buildInfo } from "@/lib/buildInfo";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { NetworkSpeedTest } from "@/features/diagnostics/components/NetworkSpeedTest";
import { useDiagnosticsDrawerOptional } from "@/features/diagnostics/context";
import { useAuth } from "@/contexts/AuthContext";
import { bridgeClient } from "@/api/bridge";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import { toast } from "sonner";

type NodeState = "ok" | "warn" | "bad" | "loading";

interface ConnectionNode {
  name: string;
  state: NodeState;
  detail?: string;
}

function NodeIcon({ state }: { state: NodeState }) {
  if (state === "loading") {
    return <span className="text-muted-foreground">⏳</span>;
  }
  if (state === "ok") {
    return <span className="text-emerald-500">✓</span>;
  }
  if (state === "warn") {
    return <span className="text-amber-400">⚠</span>;
  }
  return <span className="text-red-500">✕</span>;
}

function ConnectionPathNode({ node, isLast }: { node: ConnectionNode; isLast: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted/50 text-xs font-medium">
        <NodeIcon state={node.state} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{node.name}</div>
        {node.detail && (
          <div className="text-xs text-muted-foreground truncate">{node.detail}</div>
        )}
      </div>
      {!isLast && (
        <div className="text-muted-foreground/50 text-xs">→</div>
      )}
    </div>
  );
}

const DiagnosticsDrawer = forwardRef<HTMLDivElement>(function DiagnosticsDrawer(_props, _ref) {
  const { t } = useTranslation();
  // Use context if available, otherwise fallback to local state
  const drawerContext = useDiagnosticsDrawerOptional();
  const [localOpen, setLocalOpen] = useState(false);
  
  const open = drawerContext?.isOpen ?? localOpen;
  const setOpen = drawerContext ? (v: boolean) => (v ? drawerContext.open() : drawerContext.close()) : setLocalOpen;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [authTestState, setAuthTestState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [authTestMessage, setAuthTestMessage] = useState<string | null>(null);
  const [refreshingSession, setRefreshingSession] = useState(false);
  const [jwtExpiryCountdown, setJwtExpiryCountdown] = useState<number | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  
  const { getAccessToken, getAccessTokenAsync, isAuthenticated, refreshSession } = useAuth();
  const bridgeHealth = useBridgeHealthStatus();
  const { rateLimit, refetch: refetchBackend } = useBackendStatusContext();
  
  // Get JWT token info including expiry (static calculation)
  const token = getAccessToken();
  const tokenExpSec = useMemo(() => {
    if (!token) return null;
    try {
      const payloadBase64 = token.split('.')[1];
      const payload = JSON.parse(atob(payloadBase64));
      return typeof payload.exp === "number" ? payload.exp : null;
    } catch {
      return null;
    }
  }, [token]);

  // Derived token info for display
  const tokenInfo = useMemo(() => {
    if (!token) {
      return { present: false, length: 0, preview: null, expiresAt: null };
    }
    
    const expiresAt = tokenExpSec ? new Date(tokenExpSec * 1000) : null;
    
    return {
      present: true,
      length: token.length,
      preview: `${token.substring(0, 12)}...`,
      expiresAt,
    };
  }, [token, tokenExpSec]);

  // Format countdown for display
  const formatCountdown = (secs: number | null): string => {
    if (secs === null) return "—";
    if (secs <= 0) return "Expired";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const isTokenExpired = jwtExpiryCountdown !== null && jwtExpiryCountdown <= 0;
  const isTokenExpiringSoon = jwtExpiryCountdown !== null && jwtExpiryCountdown > 0 && jwtExpiryCountdown < 120;
  
  const handleCopyToken = useCallback(async () => {
    const currentToken = getAccessToken();
    if (!currentToken) return;
    try {
      await navigator.clipboard.writeText(currentToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      console.warn("Clipboard API not available");
    }
  }, [getAccessToken]);

  // Refresh session handler (defined before the effect that uses it)
  const handleRefreshSession = useCallback(async (isAutoRefresh = false) => {
    setRefreshingSession(true);
    const { error } = await refreshSession();
    setRefreshingSession(false);
    
    if (error) {
      setAuthTestState("error");
      setAuthTestMessage(`Refresh failed: ${error}`);
      setTimeout(() => {
        setAuthTestState("idle");
        setAuthTestMessage(null);
      }, 3000);
    } else {
      // Track when token was last refreshed
      setLastRefreshedAt(new Date());
      // Show toast for auto-refresh so user knows session was renewed
      if (isAutoRefresh) {
        toast.success(t("diagnostics.autoRefreshSuccess", "Session auto-renewed"), {
          description: t("diagnostics.autoRefreshDesc", "Your JWT was about to expire and has been refreshed."),
          duration: 4000,
        });
      }
      // Trigger single health check after refresh (not a loop)
      bridgeHealth.refetchAll();
    }
  }, [refreshSession, bridgeHealth, t]);

  // Live countdown effect for JWT expiry with auto-refresh
  useEffect(() => {
    if (!tokenExpSec) {
      setJwtExpiryCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.floor(tokenExpSec - Date.now() / 1000);
      setJwtExpiryCountdown(remaining);
      
      // Auto-refresh when expired (and not already refreshing)
      if (remaining <= 0 && !refreshingSession) {
        handleRefreshSession(true); // true = auto-refresh
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [tokenExpSec, refreshingSession, handleRefreshSession]);
  
  // Test Auth button - calls bridge /health to verify reachability (avoids rate-limit on /status)
  const handleTestAuth = useCallback(async () => {
    setAuthTestState("loading");
    setAuthTestMessage(null);
    
    try {
      // Get fresh token
      const freshToken = await getAccessTokenAsync();
      if (!freshToken) {
        setAuthTestState("error");
        setAuthTestMessage("No token available");
        return;
      }
      
      // Call bridge health endpoint (public, no rate limit risk)
      const result = await bridgeClient.health();
      if (result.status === "ok") {
        setAuthTestState("success");
        setAuthTestMessage("Bridge reachable");
      } else {
        setAuthTestState("error");
        setAuthTestMessage("Bridge returned not ok");
      }
    } catch (err) {
      setAuthTestState("error");
      const message = err instanceof Error ? err.message : "Unknown error";
      setAuthTestMessage(message);
    }
    
    // Reset after 5 seconds
    setTimeout(() => {
      setAuthTestState("idle");
      setAuthTestMessage(null);
    }, 5000);
  }, [getAccessTokenAsync]);
  
  // Derive connection path states
  const connectionPath: ConnectionNode[] = useMemo(() => {
    const getState = (value: boolean | null, isLoading: boolean, hasError: boolean): NodeState => {
      if (isLoading) return "loading";
      if (hasError) return "bad";
      if (value === true) return "ok";
      if (value === false) return "bad";
      return "warn";
    };
    
    return [
      { 
        name: t("connectionPath.client", "Client"), 
        state: "ok", 
        detail: t("connectionPath.clientDesc", "Your browser") 
      },
      { 
        name: t("connectionPath.health", "Health"), 
        state: getState(bridgeHealth.health, bridgeHealth.isLoading, bridgeHealth.healthError),
        detail: bridgeHealth.healthError 
          ? t("connectionPath.healthUnreachable", "Unreachable") 
          : t("connectionPath.healthDesc", "Bridge health")
      },
      { 
        name: t("connectionPath.bridge", "Bridge"), 
        state: getState(bridgeHealth.status, bridgeHealth.isLoading, bridgeHealth.statusError),
        detail: bridgeHealth.statusError 
          ? t("connectionPath.bridgeUnreachable", "Unreachable")
          : t("connectionPath.bridgeDesc", "API gateway")
      },
    ];
  }, [bridgeHealth, t]);
  
  // Derive stats
  const stats = useMemo(() => ({
    latencyMs: null, // Latency not exposed in current API
    lastCheck: bridgeHealth.isLoading ? null : new Date().toLocaleTimeString(),
    errorCount: [bridgeHealth.healthError, bridgeHealth.statusError].filter(Boolean).length,
    correlationId: null, // Not implemented yet
  }), [bridgeHealth]);
  
  // Build copy text
  const copyText = useMemo(() => {
    const lines = [
      "Privxx Diagnostics",
      `Version: ${buildInfo.version}`,
      "",
      "Connection Path:",
      ...connectionPath.map(n => `  ${n.name}: ${n.state}`),
      "",
      `Latency: ${stats.latencyMs != null ? `${stats.latencyMs}ms` : "—"}`,
      `Errors: ${stats.errorCount}`,
      `Last check: ${stats.lastCheck ?? "—"}`,
    ];
    return lines.join("\n");
  }, [connectionPath, stats]);
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };
  
  const handleRetry = () => {
    bridgeHealth.refetchAll();
    refetchBackend();
  };

  if (!open) {
    return <StatusPill onClick={() => setOpen(true)} />;
  }

  return (
    <>
      {/* Status pill still visible behind drawer */}
      <StatusPill onClick={() => setOpen(true)} className="opacity-0 pointer-events-none" />
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      
      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-background border-t border-border rounded-t-2xl max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h2 className="text-lg font-semibold">{t("diagnosticsTitle", "Diagnostics")}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setOpen(false)}
            aria-label={t("close", "Close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(85vh-60px)] pb-safe">
          <div className="p-4 space-y-6">
            
            {/* Section A: Connection Path */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                {t("connectionPath.title", "Connection Path")}
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                {connectionPath.map((node, i) => (
                  <ConnectionPathNode 
                    key={node.name} 
                    node={node} 
                    isLast={i === connectionPath.length - 1} 
                  />
                ))}
              </div>
              
              {/* Advanced toggle */}
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="mt-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                {showAdvanced 
                  ? t("diagnostics.hideAdvanced", "Hide technical details") 
                  : t("diagnostics.showAdvanced", "Show technical details")
                }
              </button>
              
              {showAdvanced && (
                <div className="mt-2 bg-muted/20 rounded p-2 text-xs font-mono text-muted-foreground">
                  <div>Health: {bridgeHealth.healthData?.status ?? "—"} (v{bridgeHealth.healthData?.version ?? "?"})</div>
                  <div>Status: {bridgeHealth.statusData?.state ?? "—"}</div>
                </div>
              )}
            </section>
            
            {/* Section B: Live Stats */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Gauge className="h-4 w-4" />
                {t("diagnostics.liveStats", "Live Stats")}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t("diagnostics.latency", "Latency")}</div>
                  <div className="text-lg font-semibold">
                    {stats.latencyMs != null ? `${stats.latencyMs}ms` : "—"}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="text-xs text-muted-foreground">{t("diagnostics.errors", "Errors")}</div>
                  <div className={cn(
                    "text-lg font-semibold",
                    stats.errorCount > 0 ? "text-red-500" : "text-emerald-500"
                  )}>
                    {stats.errorCount}
                  </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 col-span-2">
                  <div className="text-xs text-muted-foreground">{t("diagnostics.lastCheck", "Last Check")}</div>
                  <div className="text-sm font-medium">{stats.lastCheck ?? "—"}</div>
                </div>
              </div>
            </section>
            
            {/* Section B2: JWT Token Status */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                {t("diagnostics.jwtStatus", "JWT Token")}
              </h3>
              <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {t("diagnostics.jwtPresent", "Token present")}
                  </span>
                  <span className={cn(
                    "text-sm font-medium",
                    tokenInfo.present ? "text-emerald-500" : "text-red-500"
                  )}>
                    {tokenInfo.present ? t("common.yes", "Yes") : t("common.no", "No")}
                  </span>
                </div>
                {tokenInfo.present && (
                  <>
                    {/* Expiry warning banner */}
                    {(isTokenExpired || isTokenExpiringSoon) && (
                      <div className={cn(
                        "flex items-center gap-2 p-2 rounded text-xs",
                        isTokenExpired 
                          ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                          : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}>
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>
                          {isTokenExpired 
                            ? t("diagnostics.jwtExpiredWarning", "JWT expired — refresh session")
                            : t("diagnostics.jwtExpiringSoon", "JWT expiring soon")}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("diagnostics.jwtExpiry", "Expires in")}
                      </span>
                      <span className={cn(
                        "text-sm font-mono",
                        isTokenExpired ? "text-red-500" : isTokenExpiringSoon ? "text-amber-500" : "text-foreground"
                      )}>
                        {formatCountdown(jwtExpiryCountdown)}
                      </span>
                    </div>
                    {tokenInfo.expiresAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {t("diagnostics.jwtExpiresAt", "Expires at")}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {tokenInfo.expiresAt.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    {lastRefreshedAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {t("diagnostics.jwtLastRefreshed", "Last refreshed")}
                        </span>
                        <span className="text-xs font-mono text-emerald-500">
                          {lastRefreshedAt.toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("diagnostics.jwtLength", "Token length")}
                      </span>
                      <span className="text-sm font-mono">{tokenInfo.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono truncate flex-1 max-w-[120px]">
                        {tokenInfo.preview}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToken}
                        className="h-8 px-2 gap-1.5"
                      >
                        {tokenCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {t("diagnostics.copyToken", "Copy")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRefreshSession(false)}
                        disabled={refreshingSession}
                        className="h-8 px-2 gap-1.5"
                      >
                        <RotateCcw className={cn("h-3.5 w-3.5", refreshingSession && "animate-spin")} />
                        {t("diagnostics.refreshSession", "Refresh")}
                      </Button>
                    </div>
                  </>
                )}
                {!tokenInfo.present && isAuthenticated && (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-500">
                      {t("diagnostics.jwtMissing", "Logged in but no token found.")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefreshSession(false)}
                      disabled={refreshingSession}
                      className="w-full h-8 gap-1.5"
                    >
                      <RotateCcw className={cn("h-3.5 w-3.5", refreshingSession && "animate-spin")} />
                      {t("diagnostics.refreshSession", "Refresh Session")}
                    </Button>
                  </div>
                )}
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground">
                    {t("diagnostics.notLoggedIn", "Sign in to generate a JWT token.")}
                  </p>
                )}
                
                {/* Test Auth Button */}
                {tokenInfo.present && (
                  <div className="pt-2 border-t border-border/30">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestAuth}
                      disabled={authTestState === "loading"}
                      className="w-full h-9 gap-2"
                    >
                      {authTestState === "loading" && (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {authTestState === "success" && (
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      {authTestState === "error" && (
                        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                      {authTestState === "idle" && (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      {t("diagnostics.testAuth", "Test Auth")}
                    </Button>
                    {authTestMessage && (
                      <p className={cn(
                        "text-xs mt-2 text-center",
                        authTestState === "success" ? "text-emerald-500" : "text-red-500"
                      )}>
                        {authTestMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </section>
            
            {/* Rate Limit Banner */}
            {rateLimit.isRateLimited && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-500">
                    {t("diagnostics.rateLimited", "Rate limited")}
                  </p>
                  <p className="text-xs text-amber-500/80">
                    {t("diagnostics.rateLimitWait", "Retry in {{time}}", { time: rateLimit.formattedTime })}
                  </p>
                </div>
              </div>
            )}
            
            {/* Section C: Actions */}
            <section>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {t("diagnostics.actions", "Actions")}
              </h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={bridgeHealth.isLoading || rateLimit.isRateLimited}
                  className="h-11 px-4 gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", bridgeHealth.isLoading && "animate-spin")} />
                  {rateLimit.isRateLimited 
                    ? rateLimit.formattedTime 
                    : t("diagnostics.retry", "Retry")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-11 px-4 gap-2"
                >
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  {t("diagnostics.copy", "Copy")}
                </Button>
                <div className="h-11 flex items-center">
                  <NetworkSpeedTest />
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground/70">
                {t("diagnostics.noSignals", "Diagnostic only. No signals are sent or stored by this panel.")}
              </p>
            </section>
            
            {/* Section D: Build Info */}
            <section className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Privxx v{buildInfo.version}</span>
                <span className="px-2 py-0.5 rounded-full bg-muted/50">
                  {t("demoModeLabel", "Preview")}
                </span>
              </div>
            </section>
            
            {/* Legal Links */}
            <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60 pt-2">
              <Link to="/privacy" className="hover:text-foreground/80 transition-colors">
                {t("privacyPolicyLink", "Privacy")}
              </Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-foreground/80 transition-colors">
                {t("termsTitle", "Terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

export default DiagnosticsDrawer;
