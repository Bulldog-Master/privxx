/**
 * Passkey Form Component
 * 
 * WebAuthn passkey authentication form.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Loader2, Fingerprint } from "lucide-react";
import { usePasskey } from "../hooks/usePasskey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function PasskeyForm() {
  const { t } = useTranslation();
  const {
    authenticateWithPasskey,
    isLoading,
    error: passkeyError,
    clearError,
  } = usePasskey();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const normalizeError = (raw: string) => {
    // supabase-js uses this generic message when a function responds with non-2xx.
    // In passkey auth, this can happen for non-enumeration-safe failures (e.g., no passkey).
    if (raw.toLowerCase().includes("edge function returned a non-2xx status code")) {
      return t(
        "passkeyUnavailable",
        "Passkey sign-in is unavailable for this email. Try Sign In or Sign Up."
      );
    }

    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearError();

    if (!email) {
      setError(t("emailRequired", "Email is required"));
      return;
    }

    const success = await authenticateWithPasskey(email);
    if (success) {
      toast.success(t("passkeyAuthSuccess", "Signed in with passkey"));
    }
  };

  const displayError = error || passkeyError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="passkey-email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="passkey-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder", "you@example.com")}
            className="pl-10"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {t(
          "passkeyDescription",
          "Use Touch ID, Face ID, Windows Hello, or a security key"
        )}
      </p>

      {displayError && (
        <p className="text-sm text-destructive">{normalizeError(displayError)}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Fingerprint className="h-4 w-4 mr-2" />
        )}
        {t("signInWithPasskey", "Sign in with Passkey")}
      </Button>
    </form>
  );
}

