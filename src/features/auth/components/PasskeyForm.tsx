/**
 * Passkey Form Component
 * 
 * WebAuthn passkey authentication form.
 * Auto-detects discoverable credential support and hides email field when available.
 */

import { useState, useEffect } from "react";
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
    checkPlatformAuthenticator,
  } = usePasskey();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [supportsDiscoverable, setSupportsDiscoverable] = useState<boolean | null>(null);
  const [showEmailField, setShowEmailField] = useState(false);

  // Check if device supports platform authenticator (discoverable passkeys)
  useEffect(() => {
    const checkSupport = async () => {
      const supported = await checkPlatformAuthenticator();
      setSupportsDiscoverable(supported);
      // If not supported, always show the email field
      if (!supported) {
        setShowEmailField(true);
      }
    };
    checkSupport();
  }, [checkPlatformAuthenticator]);

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

  // Still loading support check
  if (supportsDiscoverable === null) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Only show email section if device doesn't support discoverable or user chooses to */}
      {supportsDiscoverable && !showEmailField ? (
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            {t(
              "passkeyDiscoverableHint",
              "Your device supports passkeys. Just tap the button below."
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
              {supportsDiscoverable
                ? t("emailOptional", "Email (optional)")
                : t("email", "Email")}
            </Label>
            {supportsDiscoverable && (
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
            )}
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
              required={!supportsDiscoverable}
            />
          </div>
          {supportsDiscoverable && (
            <p className="text-xs text-muted-foreground">
              {t(
                "passkeyEmailOptionalHint",
                "Leave blank to choose a passkey from this device."
              )}
            </p>
          )}
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

