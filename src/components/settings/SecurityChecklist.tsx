/**
 * Security Settings Checklist
 * 
 * Automated checklist showing leaked password protection, email confirm status, etc.
 */

import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface ChecklistItem {
  key: string;
  name: string;
  description: string;
  status: "pass" | "warn" | "fail" | "checking" | "unknown";
  details?: string;
}

export function SecurityChecklist() {
  const { t } = useTranslation();
  const { user, isEmailVerified } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const runChecks = useCallback(async () => {
    setLoading(true);
    const results: ChecklistItem[] = [];

    // Check 1: Email verified
    results.push({
      key: "email_verified",
      name: t("securityChecklist.emailVerified", "Email Verified"),
      description: t("securityChecklist.emailVerifiedDesc", "Your email address has been confirmed"),
      status: isEmailVerified ? "pass" : "warn",
      details: isEmailVerified 
        ? t("securityChecklist.emailVerifiedPass", "Email verified") 
        : t("securityChecklist.emailVerifiedWarn", "Check your inbox for verification email"),
    });

    // Check 2: 2FA enabled
    try {
      const { data, error } = await supabase.functions.invoke("totp-auth", {
        body: { action: "status" },
      });

      if (!error && data) {
        results.push({
          key: "2fa_enabled",
          name: t("securityChecklist.twoFactor", "Two-Factor Authentication"),
          description: t("securityChecklist.twoFactorDesc", "Extra security layer for your account"),
          status: data.enabled ? "pass" : "warn",
          details: data.enabled 
            ? t("securityChecklist.twoFactorPass", "2FA is enabled") 
            : t("securityChecklist.twoFactorWarn", "Enable 2FA for stronger security"),
        });
      } else {
        results.push({
          key: "2fa_enabled",
          name: t("securityChecklist.twoFactor", "Two-Factor Authentication"),
          description: t("securityChecklist.twoFactorDesc", "Extra security layer for your account"),
          status: "unknown",
          details: t("securityChecklist.checkFailed", "Could not check status"),
        });
      }
    } catch {
      results.push({
        key: "2fa_enabled",
        name: t("securityChecklist.twoFactor", "Two-Factor Authentication"),
        description: t("securityChecklist.twoFactorDesc", "Extra security layer for your account"),
        status: "unknown",
        details: t("securityChecklist.checkFailed", "Could not check status"),
      });
    }

    // Check 3: Passkeys configured
    if (user) {
      try {
        const { data, error } = await supabase
          .from("passkey_credentials")
          .select("id")
          .eq("user_id", user.id);

        results.push({
          key: "passkeys",
          name: t("securityChecklist.passkeys", "Passkeys"),
          description: t("securityChecklist.passkeysDesc", "Passwordless sign-in with biometrics"),
          status: !error && data && data.length > 0 ? "pass" : "warn",
          details: !error && data && data.length > 0 
            ? t("securityChecklist.passkeysPass", "{{count}} passkey(s) registered", { count: data.length }) 
            : t("securityChecklist.passkeysWarn", "Add a passkey for passwordless sign-in"),
        });
      } catch {
        results.push({
          key: "passkeys",
          name: t("securityChecklist.passkeys", "Passkeys"),
          description: t("securityChecklist.passkeysDesc", "Passwordless sign-in with biometrics"),
          status: "unknown",
          details: t("securityChecklist.checkFailed", "Could not check status"),
        });
      }
    }

    // Check 4: Session timeout configured
    if (user) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("session_timeout_minutes")
          .eq("user_id", user.id)
          .maybeSingle();

        const timeout = data?.session_timeout_minutes || 15;
        results.push({
          key: "session_timeout",
          name: t("securityChecklist.sessionTimeout", "Session Timeout"),
          description: t("securityChecklist.sessionTimeoutDesc", "Auto-logout after inactivity"),
          status: timeout <= 30 ? "pass" : "warn",
          details: t("securityChecklist.sessionTimeoutValue", "{{minutes}} minute timeout", { minutes: timeout }),
        });
      } catch {
        results.push({
          key: "session_timeout",
          name: t("securityChecklist.sessionTimeout", "Session Timeout"),
          description: t("securityChecklist.sessionTimeoutDesc", "Auto-logout after inactivity"),
          status: "unknown",
          details: t("securityChecklist.checkFailed", "Could not check status"),
        });
      }
    }

    // Check 5: Backend functions available
    try {
      const { error } = await supabase.functions.invoke("turnstile-config");
      results.push({
        key: "backend_available",
        name: t("securityChecklist.backendAvailable", "Backend Services"),
        description: t("securityChecklist.backendAvailableDesc", "Security infrastructure reachable"),
        status: !error ? "pass" : "fail",
        details: !error 
          ? t("securityChecklist.backendAvailablePass", "All services online") 
          : t("securityChecklist.backendAvailableFail", "Some services unreachable"),
      });
    } catch {
      results.push({
        key: "backend_available",
        name: t("securityChecklist.backendAvailable", "Backend Services"),
        description: t("securityChecklist.backendAvailableDesc", "Security infrastructure reachable"),
        status: "fail",
        details: t("securityChecklist.backendAvailableFail", "Some services unreachable"),
      });
    }

    setItems(results);
    setLoading(false);
  }, [user, isEmailVerified, t]);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const passCount = items.filter(i => i.status === "pass").length;
  const totalCount = items.length;

  const getStatusIcon = (status: ChecklistItem["status"]) => {
    switch (status) {
      case "pass":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "warn":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "fail":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "checking":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-muted" />;
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
              {t("securityChecklist.title", "Security Checklist")}
            </CardTitle>
            <CardDescription className="text-primary/70">
              {loading 
                ? t("securityChecklist.checking", "Checking security settings...") 
                : t("securityChecklist.score", "{{pass}}/{{total}} checks passed", { pass: passCount, total: totalCount })}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={runChecks} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {items.map((item) => (
              <div
                key={item.key}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  item.status === "pass" ? "bg-emerald-500/5 border-emerald-500/20" :
                  item.status === "warn" ? "bg-amber-500/5 border-amber-500/20" :
                  item.status === "fail" ? "bg-destructive/5 border-destructive/20" :
                  "bg-background/50"
                }`}
              >
                {getStatusIcon(item.status)}
                <div className="flex-1">
                  <p className="font-medium text-primary">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  {item.details && (
                    <p className={`text-xs mt-1 ${
                      item.status === "pass" ? "text-emerald-500" :
                      item.status === "warn" ? "text-amber-500" :
                      item.status === "fail" ? "text-destructive" :
                      "text-muted-foreground"
                    }`}>
                      {item.details}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Info note about backend-only settings */}
            <div className="p-3 rounded-lg bg-muted/30 border text-xs text-muted-foreground">
              <p>
                {t("securityChecklist.backendNote", "Settings like 'Leaked Password Protection' are configured in the backend panel and cannot be checked from the app.")}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
