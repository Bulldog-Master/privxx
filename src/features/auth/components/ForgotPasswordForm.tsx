/**
 * Forgot Password Form Component
 * 
 * Sends password reset email.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthMode } from "../hooks/useAuthMode";

interface ForgotPasswordFormProps {
  onModeChange: (mode: AuthMode) => void;
}

export function ForgotPasswordForm({ onModeChange }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
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
          {t("resetLinkSent", "We've sent a password reset link to")} <strong>{email}</strong>
        </p>
        <Button 
          variant="outline" 
          onClick={() => { setSent(false); onModeChange("signin"); }}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToSignIn", "Back to Sign In")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="forgot-email"
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

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Mail className="h-4 w-4 mr-2" />
        )}
        {t("sendResetLink", "Send Reset Link")}
      </Button>

      <Button 
        type="button"
        variant="ghost" 
        onClick={() => onModeChange("signin")}
        className="w-full"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t("backToSignIn", "Back to Sign In")}
      </Button>
    </form>
  );
}
