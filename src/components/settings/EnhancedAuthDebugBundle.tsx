/**
 * Enhanced Auth Debug Bundle
 * 
 * Copies a comprehensive debug bundle including backend function error bodies/status codes.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Check, Loader2, Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { buildInfo } from "@/lib/buildInfo";

interface FunctionResult {
  name: string;
  status: "pending" | "success" | "error";
  httpStatus?: number;
  body?: unknown;
  error?: string;
  latency?: number;
}

export function EnhancedAuthDebugBundle() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<FunctionResult[]>([]);
  const didAutoRunRef = useRef(false);

  const testFunctions = useCallback(async () => {
    setRunning(true);
    const functions = [
      { name: "turnstile-config", body: undefined, requiresAuth: false },
      { name: "passkey-auth", body: { action: "status" }, requiresAuth: false },
      { name: "totp-auth", body: { action: "status" }, requiresAuth: true },
      { name: "process-avatar", body: { action: "status" }, requiresAuth: true },
    ];

    const newResults: FunctionResult[] = [];

    for (const fn of functions) {
      const start = performance.now();
      try {
        const { data, error } = await supabase.functions.invoke(fn.name, {
          body: fn.body,
        });
        
        const latency = Math.round(performance.now() - start);
        const anyError = error as any;
        const httpStatus = anyError?.context?.status ?? anyError?.status;
        const bodyError = anyError?.context?.body ?? data;

        if (error) {
          newResults.push({
            name: fn.name,
            status: httpStatus === 401 || httpStatus === 403 ? "success" : "error",
            httpStatus,
            body: bodyError,
            error: anyError?.message,
            latency,
          });
        } else {
          newResults.push({
            name: fn.name,
            status: "success",
            httpStatus: 200,
            body: data,
            latency,
          });
        }
      } catch (err) {
        const latency = Math.round(performance.now() - start);
        const anyErr = err as any;
        newResults.push({
          name: fn.name,
          status: "error",
          httpStatus: anyErr?.status,
          error: err instanceof Error ? err.message : String(err),
          latency,
        });
      }
    }

    setResults(newResults);
    setRunning(false);
  }, []);

  useEffect(() => {
    if (didAutoRunRef.current) return;
    didAutoRunRef.current = true;
    testFunctions();
  }, [testFunctions]);

  const copyBundle = useCallback(async () => {
    const bundle = {
      build: `v${buildInfo.version}${buildInfo.build ? `+${buildInfo.build}` : ""}`,
      timestamp: new Date().toISOString(),
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      authFunctions: results.map(r => ({
        function: r.name,
        status: r.status,
        httpStatus: r.httpStatus,
        latency: r.latency ? `${r.latency}ms` : null,
        response: r.body,
        error: r.error,
      })),
    };

    await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    toast.success(t("debugBundle.copied", "Full auth debug bundle copied"));
    setTimeout(() => setCopied(false), 2000);
  }, [results, t]);

  const allOk = results.every(r => r.status === "success");
  const anyError = results.some(r => r.status === "error");

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bug className="h-5 w-5" />
          {t("debugBundle.title", "Auth Debug Bundle")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("debugBundle.description", "Capture detailed error bodies and HTTP status codes")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.name} className="flex items-center justify-between p-2 rounded border bg-background/50 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-primary font-mono">{r.name}</span>
                {r.latency && <span className="text-xs text-muted-foreground">{r.latency}ms</span>}
              </div>
              <div className="flex items-center gap-2">
                {r.httpStatus && (
                  <span className={`text-xs font-mono ${r.status === "success" ? "text-emerald-500" : "text-destructive"}`}>
                    HTTP {r.httpStatus}
                  </span>
                )}
                <div className={`h-2 w-2 rounded-full ${
                  r.status === "success" ? "bg-emerald-500" : 
                  r.status === "error" ? "bg-destructive" : 
                  "bg-muted animate-pulse"
                }`} />
              </div>
            </div>
          ))}
        </div>

        {anyError && (
          <p className="text-xs text-destructive">
            {t("debugBundle.errorsDetected", "Some services returned errors — see full bundle for details")}
          </p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" onClick={testFunctions} disabled={running} className="flex-1">
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t("debugBundle.refresh", "Refresh")}
          </Button>
          <Button onClick={copyBundle} disabled={running} className="flex-1">
            {copied ? <Check className="h-4 w-4 mr-2 text-emerald-500" /> : <Copy className="h-4 w-4 mr-2" />}
            {t("debugBundle.copy", "Copy Full Bundle")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
