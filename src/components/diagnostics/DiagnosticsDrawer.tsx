import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { 
  X, Copy, RefreshCw, Gauge, Check, ChevronDown, ChevronUp,
  Monitor, Server, Wifi, Shield, Key
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StatusPill } from "./StatusPill";
import { buildInfo } from "@/lib/buildInfo";
import { useBridgeHealthStatus } from "@/features/diagnostics/hooks/useBridgeHealthStatus";
import { NetworkSpeedTest } from "@/features/diagnostics/components/NetworkSpeedTest";
import { useAuth } from "@/contexts/AuthContext";

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

const DiagnosticsDrawer = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  
  const { getAccessToken, isAuthenticated } = useAuth();
  const bridgeHealth = useBridgeHealthStatus();
  
  // Get JWT token info
  const token = getAccessToken();
  const tokenInfo = useMemo(() => ({
    present: !!token,
    length: token?.length ?? 0,
    preview: token ? `${token.substring(0, 12)}...` : null,
  }), [token]);
  
  const handleCopyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  };
  
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
        name: t("connectionPath.proxy", "Proxy"), 
        state: getState(bridgeHealth.health, bridgeHealth.isLoading, bridgeHealth.healthError),
        detail: bridgeHealth.healthError 
          ? t("connectionPath.proxyUnreachable", "Unreachable") 
          : t("connectionPath.proxyDesc", "Edge relay")
      },
      { 
        name: t("connectionPath.bridge", "Bridge"), 
        state: getState(bridgeHealth.xxdkInfo, bridgeHealth.isLoading, bridgeHealth.xxdkError),
        detail: bridgeHealth.xxdkError 
          ? t("connectionPath.bridgeUnreachable", "Unreachable")
          : t("connectionPath.bridgeDesc", "API gateway")
      },
      { 
        name: t("connectionPath.xxdk", "xxDK"), 
        state: getState(bridgeHealth.cmixxStatus, bridgeHealth.isLoading, bridgeHealth.cmixxError),
        detail: bridgeHealth.cmixxError 
          ? t("connectionPath.xxdkUnreachable", "Unreachable")
          : t("connectionPath.xxdkDesc", "Privacy client")
      },
    ];
  }, [bridgeHealth, t]);
  
  // Derive stats
  const stats = useMemo(() => ({
    latencyMs: null, // Latency not exposed in current API
    lastCheck: bridgeHealth.isLoading ? null : new Date().toLocaleTimeString(),
    errorCount: [bridgeHealth.healthError, bridgeHealth.xxdkError, bridgeHealth.cmixxError].filter(Boolean).length,
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
                  <div>Proxy: {bridgeHealth.healthData?.service ?? "—"}</div>
                  <div>Bridge Mode: {bridgeHealth.xxdkData?.mode ?? "—"}</div>
                  <div>xxDK Mode: {bridgeHealth.cmixxData?.mode ?? "—"}</div>
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t("diagnostics.jwtLength", "Token length")}
                      </span>
                      <span className="text-sm font-mono">{tokenInfo.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                        {tokenInfo.preview}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyToken}
                        className="h-8 px-2 gap-1.5"
                      >
                        {tokenCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        {t("diagnostics.copyToken", "Copy JWT")}
                      </Button>
                    </div>
                  </>
                )}
                {!tokenInfo.present && isAuthenticated && (
                  <p className="text-xs text-amber-500">
                    {t("diagnostics.jwtMissing", "Logged in but no token found. Try refreshing.")}
                  </p>
                )}
                {!isAuthenticated && (
                  <p className="text-xs text-muted-foreground">
                    {t("diagnostics.notLoggedIn", "Sign in to generate a JWT token.")}
                  </p>
                )}
              </div>
            </section>
            
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
                  disabled={bridgeHealth.isLoading}
                  className="h-11 px-4 gap-2"
                >
                  <RefreshCw className={cn("h-4 w-4", bridgeHealth.isLoading && "animate-spin")} />
                  {t("diagnostics.retry", "Retry")}
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
};

export default DiagnosticsDrawer;
