/**
 * Backend Health Panel
 * Pings all Edge Functions in one click and shows aggregate health.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2,
  Shield,
  Fingerprint,
  ShieldCheck,
  Image,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "idle" | "checking" | "ok" | "error";

interface FunctionState {
  status: Status;
  error: string | null;
  latency: number | null;
}

export interface BackendHealthReport {
  generatedAt: string;
  functions: Record<string, FunctionState>;
}

interface BackendHealthPanelProps {
  autoRun?: boolean;
  onReportChange?: (report: BackendHealthReport) => void;
}

const FUNCTIONS: { key: string; name: string; icon: typeof Shield; requiresAuth: boolean }[] = [
  { key: "turnstile-config", name: "Turnstile", icon: ShieldCheck, requiresAuth: false },
  { key: "passkey-auth", name: "Passkey", icon: Fingerprint, requiresAuth: false },
  { key: "totp-auth", name: "2FA (TOTP)", icon: Shield, requiresAuth: true },
  { key: "process-avatar", name: "Avatar", icon: Image, requiresAuth: true },
];

const initialState = (): Record<string, FunctionState> =>
  Object.fromEntries(FUNCTIONS.map((f) => [f.key, { status: "idle" as Status, error: null, latency: null }]));

function buildReport(states: Record<string, FunctionState>): BackendHealthReport {
  return {
    generatedAt: new Date().toISOString(),
    functions: states,
  };
}

export function BackendHealthPanel({ autoRun, onReportChange }: BackendHealthPanelProps) {
  const { t } = useTranslation();
  const [states, setStates] = useState<Record<string, FunctionState>>(initialState);
  const [running, setRunning] = useState(false);
  const didAutoRunRef = useRef(false);

  useEffect(() => {
    onReportChange?.(buildReport(states));
  }, [onReportChange, states]);

  const pingFunction = useCallback(async (fnKey: string, requiresAuth: boolean) => {
    setStates((prev) => ({ ...prev, [fnKey]: { status: "checking", error: null, latency: null } }));
    const start = performance.now();
    try {
      // For functions that require auth, we still invoke but expect a 401 if not authed
      // We consider 401 "reachable" since the function itself responded
      const { error } = await supabase.functions.invoke(fnKey, {
        body: fnKey === "turnstile-config" ? undefined : { action: "status" },
      });

      const latency = Math.round(performance.now() - start);

      if (error) {
        // Check if error indicates function is reachable but returned error
        const msg = typeof error === "object" && "message" in error ? (error as { message: string }).message : String(error);
        // 401/403 means function is reachable
        if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
          setStates((prev) => ({ ...prev, [fnKey]: { status: "ok", error: null, latency } }));
          return;
        }
        setStates((prev) => ({ ...prev, [fnKey]: { status: "error", error: msg, latency } }));
        return;
      }

      setStates((prev) => ({ ...prev, [fnKey]: { status: "ok", error: null, latency } }));
    } catch (err) {
      const latency = Math.round(performance.now() - start);
      setStates((prev) => ({
        ...prev,
        [fnKey]: { status: "error", error: err instanceof Error ? err.message : String(err), latency },
      }));
    }
  }, []);

  const runAll = useCallback(async () => {
    setRunning(true);
    await Promise.all(FUNCTIONS.map((f) => pingFunction(f.key, f.requiresAuth)));
    setRunning(false);
  }, [pingFunction]);

  useEffect(() => {
    if (!autoRun) return;
    if (didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    runAll();
  }, [autoRun, runAll]);

  const statusIcon = (s: Status) => {
    switch (s) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "ok":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const allOk = FUNCTIONS.every((f) => states[f.key].status === "ok");
  const anyError = FUNCTIONS.some((f) => states[f.key].status === "error");

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5" />
          {t("backendHealth.title", "Backend Health")}
          {allOk && <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />}
          {anyError && <XCircle className="h-4 w-4 text-destructive ml-auto" />}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("backendHealth.description", "Ping all Edge Functions")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {FUNCTIONS.map((fn) => {
          const state = states[fn.key];
          const Icon = fn.icon;
          return (
            <div key={fn.key} className="space-y-1">
              <div className="flex items-center justify-between p-2 rounded border bg-background/50 text-sm">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-primary/70" />
                  <span className="text-primary">{fn.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {state.latency !== null && (
                    <span className="text-xs text-muted-foreground">{state.latency}ms</span>
                  )}
                  {statusIcon(state.status)}
                </div>
              </div>
              {state.error && (
                <p className="text-xs text-destructive px-2 break-all">{state.error}</p>
              )}
            </div>
          );
        })}

        <Button variant="outline" onClick={runAll} disabled={running} className="w-full mt-2">
          <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
          {t("backendHealth.runAll", "Run All Tests")}
        </Button>
      </CardContent>
    </Card>
  );
}
