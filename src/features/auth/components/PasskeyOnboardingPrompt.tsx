/**
 * Passkey Onboarding Prompt
 * 
 * Prompts users to set up a passkey after their first sign-in.
 * Only shows if user doesn't have passkeys and hasn't dismissed.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Fingerprint, X, Loader2, Shield, Sparkles } from "lucide-react";
import { usePasskey } from "../hooks/usePasskey";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const DISMISSED_KEY = "privxx_passkey_onboarding_dismissed";
const CHECK_DELAY_MS = 2000; // Wait 2s after auth before showing

interface PasskeyOnboardingPromptProps {
  className?: string;
}

export function PasskeyOnboardingPrompt({ className }: PasskeyOnboardingPromptProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { registerPasskey, isLoading, isSupported, checkPlatformAuthenticator } = usePasskey();
  
  const [show, setShow] = useState(false);
  const [hasPasskeys, setHasPasskeys] = useState<boolean | null>(null);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check if user has passkeys and if device supports platform authenticator
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setShow(false);
      return;
    }

    // Check if already dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed === user.id) {
      setShow(false);
      return;
    }

    // Check platform authenticator support
    const checkSupport = async () => {
      const supported = await checkPlatformAuthenticator();
      setHasPlatformAuth(supported);
      
      // If no platform authenticator, don't bother prompting
      if (!supported) {
        setShow(false);
        return;
      }
    };

    // Check if user has any passkeys
    const checkPasskeys = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("passkey-auth", {
          body: { action: "status" },
        });

        if (error) {
          console.error("[PasskeyOnboarding] Status check error:", error);
          return;
        }

        const count = data?.credentialCount ?? 0;
        setHasPasskeys(count > 0);

        // Only show if user has no passkeys and we haven't shown already
        if (count === 0) {
          // Delay showing to avoid being too aggressive
          setTimeout(() => setShow(true), CHECK_DELAY_MS);
        }
      } catch (err) {
        console.error("[PasskeyOnboarding] Error checking passkeys:", err);
      }
    };

    checkSupport();
    checkPasskeys();
  }, [isAuthenticated, user, checkPlatformAuthenticator]);

  const handleDismiss = () => {
    if (user) {
      localStorage.setItem(DISMISSED_KEY, user.id);
    }
    setShow(false);
  };

  const handleSetup = async () => {
    setIsRegistering(true);
    const success = await registerPasskey();
    setIsRegistering(false);

    if (success) {
      toast.success(t("passkeyRegistered", "Passkey set up successfully!"));
      setShow(false);
      // Mark as completed so we don't show again
      if (user) {
        localStorage.setItem(DISMISSED_KEY, user.id);
      }
    } else {
      toast.error(t("passkeySetupFailed", "Failed to set up passkey. You can try again later in Settings."));
    }
  };

  // Don't render if conditions not met
  if (!show || !isSupported || hasPasskeys !== false || !hasPlatformAuth) {
    return null;
  }

  return (
    <Card className={`bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20 ${className}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Fingerprint className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {t("setupPasskey", "Set up a Passkey")}
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(
                    "passkeyOnboardingDesc",
                    "Sign in faster and more securely with Touch ID, Face ID, or Windows Hello."
                  )}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1 -mr-1 -mt-1"
                aria-label={t("dismiss", "Dismiss")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleSetup}
                disabled={isRegistering || isLoading}
                className="h-8 text-xs"
              >
                {isRegistering || isLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Shield className="h-3.5 w-3.5 mr-1.5" />
                )}
                {t("setupNow", "Set up now")}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="h-8 text-xs text-muted-foreground"
              >
                {t("maybeLater", "Maybe later")}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
