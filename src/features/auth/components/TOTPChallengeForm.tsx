/**
 * TOTP Challenge Form
 * 
 * Shows 2FA code input after successful password authentication.
 * Blocks login until valid TOTP code is provided.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Shield, Loader2, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface TOTPChallengeFormProps {
  onVerified: () => void;
  onCancel: () => void;
  onUseBackupCode: () => void;
}

export function TOTPChallengeForm({ onVerified, onCancel, onUseBackupCode }: TOTPChallengeFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== 6) {
      setError(t("invalidCodeLength", "Please enter a 6-digit code"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("totp-auth", {
        body: { action: "verify", code },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      if (data.verified) {
        onVerified();
      } else {
        setError(t("invalidCode", "Invalid verification code"));
      }
    } catch (err) {
      console.error("[TOTPChallengeForm] Verification error:", err);
      setError(t("verificationFailed", "Verification failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">
          {t("twoFactorRequired", "Two-Factor Authentication")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("enterAuthCode", "Enter the 6-digit code from your authenticator app")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="totp-code">{t("verificationCode", "Verification Code")}</Label>
          <Input
            id="totp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            className="text-center text-2xl tracking-widest font-mono"
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Shield className="h-4 w-4 mr-2" />
          )}
          {t("verify", "Verify")}
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onUseBackupCode}
          className="w-full text-sm"
        >
          <Key className="h-4 w-4 mr-2" />
          {t("useBackupCode", "Use backup code")}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className="w-full text-sm text-muted-foreground"
        >
          {t("cancel", "Cancel")}
        </Button>
      </div>
    </div>
  );
}
