/**
 * Passkey Form Component
 * 
 * WebAuthn passkey authentication form.
 * Email field is hidden by default; user can toggle it open.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Loader2, Fingerprint, ChevronDown, ChevronUp } from "lucide-react";
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
  const [showEmailField, setShowEmailField] = useState(false);

  const normalizeError = (raw: string) => {
    if (raw.toLowerCase().includes("edge function returned a non-2xx status code")) {
      return t("connectionFailed", "Connection Failed");
    }
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    clearError();

    // Use email only if provided
    const emailToUse = email.trim() ? email.trim() : null;
    const success = await authenticateWithPasskey(emailToUse);
    if (success) {
      toast.success(t("passkeyAuthSuccess", "Signed in with passkey"));
    }
  };

  const displayError = error || passkeyError;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email hidden by default; toggle to show */}
      {!showEmailField ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t(
              "passkeyDiscoverableHint",
              "Just tap the button below to sign in with your passkey."
            )}
          </p>
          <button
            type="button"
            onClick={() => setShowEmailField(true)}
            className="text-xs text-primary/70 hover:text-primary flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            {t("enterEmailInstead", "Enter email instead")}
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="passkey-email">
              {t("emailOptional", "Email (optional)")}
            </Label>
            <button
              type="button"
              onClick={() => {
                setShowEmailField(false);
                setEmail("");
              }}
              className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
            >
              {t("hideEmail", "Hide")}
              <ChevronUp className="h-3 w-3" />
            </button>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="passkey-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder", "you@example.com")}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t(
              "passkeyEmailOptionalHint",
              "Leave blank to choose a passkey from this device."
            )}
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        {t(
          "passkeyDescription",
          "Use Touch ID, Face ID, Windows Hello, or a security key"
        )}
      </p>

      {displayError && (
        <p className="text-sm text-destructive text-center">{normalizeError(displayError)}</p>
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
