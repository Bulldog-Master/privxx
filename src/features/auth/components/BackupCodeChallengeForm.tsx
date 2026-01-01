/**
 * Backup Code Challenge Form
 * 
 * Alternative 2FA verification using backup codes.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Key, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

interface BackupCodeChallengeFormProps {
  onVerified: () => void;
  onBack: () => void;
}

export function BackupCodeChallengeForm({ onVerified, onBack }: BackupCodeChallengeFormProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length < 8) {
      setError(t("invalidBackupCode", "Please enter a valid backup code"));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("totp-auth", {
        body: { action: "verify-backup", code: code.replace(/\s/g, "") },
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
        setError(t("invalidBackupCode", "Invalid backup code"));
      }
    } catch (err) {
      console.error("[BackupCodeChallengeForm] Verification error:", err);
      setError(t("verificationFailed", "Verification failed. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Key className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">
          {t("useBackupCode", "Use Backup Code")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("enterBackupCode", "Enter one of your recovery backup codes")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="backup-code">{t("backupCode", "Backup Code")}</Label>
          <Input
            id="backup-code"
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setError(null);
            }}
            placeholder="XXXX-XXXX"
            className="text-center font-mono"
            disabled={isLoading}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={isLoading || code.length < 8}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          {t("verify", "Verify")}
        </Button>
      </form>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="w-full text-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("backToAuthenticator", "Back to authenticator")}
      </Button>
    </div>
  );
}
