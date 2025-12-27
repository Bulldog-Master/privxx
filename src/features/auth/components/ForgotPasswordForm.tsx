/**
 * Forgot Password Form Component
 * 
 * Sends password reset email with Zod validation.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../validation/schemas";
import type { AuthMode } from "../hooks/useAuthMode";

interface ForgotPasswordFormProps {
  onModeChange: (mode: AuthMode) => void;
}

export function ForgotPasswordForm({ onModeChange }: ForgotPasswordFormProps) {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ForgotPasswordValues) => {
    setServerError(null);
    const result = await resetPassword(values.email);
    if (result.error) {
      setServerError(result.error);
    } else {
      setSentEmail(values.email);
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6 space-y-3">
        <Mail className="h-12 w-12 mx-auto text-primary" />
        <h3 className="font-medium">{t("checkYourEmail", "Check your email")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("resetLinkSent", "We've sent a password reset link to")} <strong>{sentEmail}</strong>
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="forgot-email"
            type="email"
            {...form.register("email")}
            placeholder={t("emailPlaceholder", "you@example.com")}
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
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
