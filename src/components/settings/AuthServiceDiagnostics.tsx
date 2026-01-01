/**
 * Auth Service Diagnostics Component
 * Shows status of passkey-auth and totp-auth edge functions
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Fingerprint, RefreshCw, CheckCircle, XCircle, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { buildInfo } from "@/lib/buildInfo";
import { toast } from "sonner";

type ServiceStatus = "unknown" | "checking" | "available" | "unavailable";

interface ServiceState {
  status: ServiceStatus;
  lastCheck: Date | null;
  lastError: string | null;
}

type ServiceKey = "passkey" | "totp";

function formatInvokeError(err: unknown): string {
  if (!err) return "Unknown error";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

export function AuthServiceDiagnostics() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [passkeyService, setPasskeyService] = useState<ServiceState>({
    status: "unknown",
    lastCheck: null,
    lastError: null,
  });
  const [totpService, setTotpService] = useState<ServiceState>({
    status: "unknown",
    lastCheck: null,
    lastError: null,
  });

  const checkService = useCallback(async (service: ServiceKey) => {
    const setState = service === "passkey" ? setPasskeyService : setTotpService;
    const fnName = service === "passkey" ? "passkey-auth" : "totp-auth";

    setState((prev) => ({ ...prev, status: "checking" }));

    try {
      const { error } = await supabase.functions.invoke(fnName, {
        body: { action: "status" },
      });

      if (error) {
        setState({ status: "unavailable", lastCheck: new Date(), lastError: formatInvokeError(error) });
        return;
      }

      setState({ status: "available", lastCheck: new Date(), lastError: null });
    } catch (err) {
      setState({ status: "unavailable", lastCheck: new Date(), lastError: formatInvokeError(err) });
    }
  }, []);

  const checkAll = useCallback(() => {
    checkService("passkey");
    checkService("totp");
  }, [checkService]);

  const copyDebugBundle = useCallback(() => {
    const bundle = {
      build: `v${buildInfo.version}${buildInfo.build ? `+${buildInfo.build}` : ""}`,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      origin: window.location.origin,
      passkey: {
        status: passkeyService.status,
        lastCheck: passkeyService.lastCheck?.toISOString() ?? null,
        error: passkeyService.lastError,
      },
      totp: {
        status: totpService.status,
        lastCheck: totpService.lastCheck?.toISOString() ?? null,
        error: totpService.lastError,
      },
    };
    navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
    setCopied(true);
    toast.success(t("authDiagnostics.copiedToast", "Diagnostics copied to clipboard"));
    setTimeout(() => setCopied(false), 2000);
  }, [passkeyService, totpService, t]);

  const getStatusIcon = (status: ServiceStatus) => {
    switch (status) {
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case "available":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "unavailable":
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  const getStatusText = (status: ServiceStatus) => {
    switch (status) {
      case "checking":
        return t("authDiagnostics.checking", "Checking...");
      case "available":
        return t("authDiagnostics.available", "Available");
      case "unavailable":
        return t("authDiagnostics.unavailable", "Unavailable");
      default:
        return "—";
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          {t("authDiagnostics.title", "Authentication Services")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("authDiagnostics.description", "Status of passkey and 2FA endpoints")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Passkey Service */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
            <div className="flex items-center gap-3">
              <Fingerprint className="h-5 w-5 text-primary/70" />
              <div>
                <p className="text-sm font-medium text-primary">
                  {t("authDiagnostics.passkeyService", "Passkey Service")}
                </p>
                {passkeyService.lastCheck && (
                  <p className="text-xs text-muted-foreground">
                    {t("authDiagnostics.lastCheck", "Last checked")} {formatDistanceToNow(passkeyService.lastCheck, { addSuffix: true })}
                  </p>
                )}
                {passkeyService.lastError && (
                  <p className="text-xs text-destructive break-words">
                    {passkeyService.lastError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(passkeyService.status)}
              <span className="text-sm">{getStatusText(passkeyService.status)}</span>
            </div>
          </div>

          {/* TOTP Service */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary/70" />
              <div>
                <p className="text-sm font-medium text-primary">
                  {t("authDiagnostics.totpService", "2FA Service")}
                </p>
                {totpService.lastCheck && (
                  <p className="text-xs text-muted-foreground">
                    {t("authDiagnostics.lastCheck", "Last checked")} {formatDistanceToNow(totpService.lastCheck, { addSuffix: true })}
                  </p>
                )}
                {totpService.lastError && (
                  <p className="text-xs text-destructive break-words">
                    {totpService.lastError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(totpService.status)}
              <span className="text-sm">{getStatusText(totpService.status)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={checkAll}
            disabled={passkeyService.status === "checking" || totpService.status === "checking"}
            className="flex-1"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("authDiagnostics.checkNow", "Check Now")}
          </Button>
          <Button variant="ghost" size="icon" onClick={copyDebugBundle} aria-label={t("authDiagnostics.copyBundle", "Copy debug bundle")}>
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
