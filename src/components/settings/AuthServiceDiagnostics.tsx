/**
 * Auth Service Diagnostics Component
 * Shows status of passkey-auth and totp-auth edge functions
 */

import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Fingerprint, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

type ServiceStatus = "unknown" | "checking" | "available" | "unavailable";

interface ServiceState {
  status: ServiceStatus;
  lastCheck: Date | null;
}

export function AuthServiceDiagnostics() {
  const { t } = useTranslation();
  const [passkeyService, setPasskeyService] = useState<ServiceState>({ status: "unknown", lastCheck: null });
  const [totpService, setTotpService] = useState<ServiceState>({ status: "unknown", lastCheck: null });

  const checkPasskey = useCallback(async () => {
    setPasskeyService({ status: "checking", lastCheck: passkeyService.lastCheck });
    try {
      // Simple OPTIONS request to check if function is reachable
      const { error } = await supabase.functions.invoke("passkey-auth", {
        body: { action: "status-check" },
      });
      // Any response (including 400 for invalid action) means service is up
      setPasskeyService({ status: error?.message?.includes("non-2xx") ? "unavailable" : "available", lastCheck: new Date() });
    } catch {
      setPasskeyService({ status: "unavailable", lastCheck: new Date() });
    }
  }, [passkeyService.lastCheck]);

  const checkTotp = useCallback(async () => {
    setTotpService({ status: "checking", lastCheck: totpService.lastCheck });
    try {
      const { error } = await supabase.functions.invoke("totp-auth", {
        body: { action: "status" },
      });
      setTotpService({ status: error?.message?.includes("non-2xx") ? "unavailable" : "available", lastCheck: new Date() });
    } catch {
      setTotpService({ status: "unavailable", lastCheck: new Date() });
    }
  }, [totpService.lastCheck]);

  const checkAll = useCallback(() => {
    checkPasskey();
    checkTotp();
  }, [checkPasskey, checkTotp]);

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
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(totpService.status)}
              <span className="text-sm">{getStatusText(totpService.status)}</span>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={checkAll}
          disabled={passkeyService.status === "checking" || totpService.status === "checking"}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          {t("authDiagnostics.checkNow", "Check Now")}
        </Button>
      </CardContent>
    </Card>
  );
}
