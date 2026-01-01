/**
 * Backend Status Page
 * 
 * Dedicated page showing clear status: reachable vs auth-required vs blocked-by-origin.
 */

import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CheckCircle, XCircle, ShieldAlert, Loader2, RefreshCw, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageBackground } from "@/components/layout/PageBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuildVersionBadge } from "@/components/shared";
import { buildInfo } from "@/lib/buildInfo";
import { toast } from "sonner";

type StatusLevel = "reachable" | "auth-required" | "blocked" | "error" | "checking" | "idle";

interface FunctionStatus {
  name: string;
  displayName: string;
  status: StatusLevel;
  httpStatus?: number;
  error?: string;
  latency?: number;
}

const FUNCTIONS = [
  { name: "turnstile-config", displayName: "Turnstile Config", body: undefined },
  { name: "passkey-auth", displayName: "Passkey Auth", body: { action: "status" } },
  { name: "totp-auth", displayName: "2FA (TOTP)", body: { action: "status" } },
  { name: "process-avatar", displayName: "Avatar Processing", body: { action: "status" } },
  { name: "verify-turnstile", displayName: "Turnstile Verify", body: { token: "test" } },
];

function getStatusLevel(httpStatus: number | undefined, errorMsg: string | undefined): StatusLevel {
  if (!httpStatus && !errorMsg) return "idle";
  
  if (httpStatus === 200) return "reachable";
  if (httpStatus === 401 || httpStatus === 403) return "auth-required";
  if (errorMsg?.toLowerCase().includes("cors") || errorMsg?.toLowerCase().includes("origin")) return "blocked";
  return "error";
}

function StatusBadge({ status }: { status: StatusLevel }) {
  const { t } = useTranslation();
  
  switch (status) {
    case "reachable":
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
        <CheckCircle className="h-3 w-3 mr-1" /> {t("backendStatus.reachable", "Reachable")}
      </Badge>;
    case "auth-required":
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">
        <ShieldAlert className="h-3 w-3 mr-1" /> {t("backendStatus.authRequired", "Auth Required")}
      </Badge>;
    case "blocked":
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
        <XCircle className="h-3 w-3 mr-1" /> {t("backendStatus.blocked", "Blocked (CORS)")}
      </Badge>;
    case "error":
      return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
        <XCircle className="h-3 w-3 mr-1" /> {t("backendStatus.error", "Error")}
      </Badge>;
    case "checking":
      return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" /> {t("backendStatus.checking", "Checking...")}
      </Badge>;
    default:
      return <Badge variant="outline" className="bg-muted text-muted-foreground">—</Badge>;
  }
}

export default function BackendStatus() {
  const { t } = useTranslation();
  const [statuses, setStatuses] = useState<FunctionStatus[]>(
    FUNCTIONS.map(f => ({ name: f.name, displayName: f.displayName, status: "idle" }))
  );
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkAll = useCallback(async () => {
    setRunning(true);
    setStatuses(FUNCTIONS.map(f => ({ name: f.name, displayName: f.displayName, status: "checking" })));

    const results: FunctionStatus[] = [];

    for (const fn of FUNCTIONS) {
      const start = performance.now();
      try {
        const { data, error } = await supabase.functions.invoke(fn.name, { body: fn.body });
        const latency = Math.round(performance.now() - start);
        const anyError = error as any;
        const httpStatus = anyError?.context?.status ?? anyError?.status ?? (error ? undefined : 200);
        const errorMsg = anyError?.message;

        results.push({
          name: fn.name,
          displayName: fn.displayName,
          status: getStatusLevel(httpStatus, errorMsg),
          httpStatus,
          error: errorMsg,
          latency,
        });
      } catch (err) {
        const latency = Math.round(performance.now() - start);
        const anyErr = err as any;
        results.push({
          name: fn.name,
          displayName: fn.displayName,
          status: "error",
          httpStatus: anyErr?.status,
          error: err instanceof Error ? err.message : String(err),
          latency,
        });
      }
    }

    setStatuses(results);
    setRunning(false);
  }, []);

  useEffect(() => {
    checkAll();
  }, [checkAll]);

  const copyReport = useCallback(async () => {
    const report = {
      build: `v${buildInfo.version}${buildInfo.build ? `+${buildInfo.build}` : ""}`,
      timestamp: new Date().toISOString(),
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      statuses: statuses.map(s => ({
        function: s.name,
        status: s.status,
        httpStatus: s.httpStatus,
        latency: s.latency ? `${s.latency}ms` : null,
        error: s.error,
      })),
    };

    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    toast.success(t("backendStatus.copied", "Status report copied"));
    setTimeout(() => setCopied(false), 2000);
  }, [statuses, t]);

  const summary = {
    reachable: statuses.filter(s => s.status === "reachable").length,
    authRequired: statuses.filter(s => s.status === "auth-required").length,
    errors: statuses.filter(s => s.status === "error" || s.status === "blocked").length,
  };

  return (
    <PageBackground>
      <main className="max-w-2xl mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary/80">
            <Link to="/settings">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary">{t("backendStatus.title", "Backend Status")}</h1>
              <BuildVersionBadge />
            </div>
            <p className="text-sm text-primary/70">
              {t("backendStatus.subtitle", "Reachable vs auth-required vs blocked")}
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={checkAll} disabled={running}>
              <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline" size="icon" onClick={copyReport}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="bg-emerald-500/10 border-emerald-500/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-emerald-500">{summary.reachable}</p>
              <p className="text-xs text-emerald-500/70">{t("backendStatus.reachable", "Reachable")}</p>
            </CardContent>
          </Card>
          <Card className="bg-amber-500/10 border-amber-500/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{summary.authRequired}</p>
              <p className="text-xs text-amber-500/70">{t("backendStatus.authRequired", "Auth Required")}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-destructive">{summary.errors}</p>
              <p className="text-xs text-destructive/70">{t("backendStatus.errors", "Errors")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Status */}
        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-primary">{t("backendStatus.detailedStatus", "Detailed Status")}</CardTitle>
            <CardDescription className="text-primary/70">
              {t("backendStatus.detailedDesc", "Individual function connectivity")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statuses.map((s) => (
              <div key={s.name} className="p-3 rounded-lg border bg-background/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">{s.displayName}</p>
                    <p className="text-xs text-muted-foreground font-mono">{s.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.latency && <span className="text-xs text-muted-foreground">{s.latency}ms</span>}
                    <StatusBadge status={s.status} />
                  </div>
                </div>
                {s.error && (
                  <p className="text-xs text-destructive break-all">{s.error}</p>
                )}
                {s.httpStatus && (
                  <p className="text-xs text-muted-foreground">HTTP {s.httpStatus}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
          <h3 className="text-sm font-medium text-primary mb-2">{t("backendStatus.legend", "Status Legend")}</h3>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p><span className="text-emerald-500">●</span> {t("backendStatus.reachableDesc", "Reachable — Function responded with 200 OK")}</p>
            <p><span className="text-amber-500">●</span> {t("backendStatus.authRequiredDesc", "Auth Required — Function reachable but needs authentication (401/403)")}</p>
            <p><span className="text-destructive">●</span> {t("backendStatus.blockedDesc", "Blocked/Error — CORS issue or server error")}</p>
          </div>
        </div>
      </main>
    </PageBackground>
  );
}
