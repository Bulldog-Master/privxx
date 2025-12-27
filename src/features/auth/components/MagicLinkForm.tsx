/**
 * Magic Link Form Component
 * 
 * Passwordless sign-in via email magic link.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MagicLinkForm() {
  const { t } = useTranslation();
  const { signInWithMagicLink } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithMagicLink(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <Mail className="h-12 w-12 mx-auto text-primary" />
        <h3 className="font-medium">{t("checkYourEmail", "Check your email")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("magicLinkSent", "We've sent a magic link to")} <strong>{email}</strong>
        </p>
        <p className="text-xs text-muted-foreground">
          {t("magicLinkHint", "Click the link in the email to sign in")}
        </p>
        <Button 
          variant="outline" 
          onClick={() => setSent(false)}
          className="mt-4"
        >
          {t("tryAgain", "Try again")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="magic-email"
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
        {t("magicLinkDescription", "We'll send you a link to sign in without a password")}
      </p>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="h-4 w-4 mr-2" />
        )}
        {t("sendMagicLink", "Send Magic Link")}
      </Button>
    </form>
  );
}
