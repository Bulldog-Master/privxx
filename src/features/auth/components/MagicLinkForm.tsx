/**
 * Magic Link Form Component
 * 
 * Passwordless sign-in via email magic link with Zod validation.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { magicLinkSchema, type MagicLinkValues } from "../validation/schemas";

export function MagicLinkForm() {
  const { t } = useTranslation();
  const { signInWithMagicLink } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const form = useForm<MagicLinkValues>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: { email: "" },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: MagicLinkValues) => {
    setServerError(null);
    const result = await signInWithMagicLink(values.email);
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
          {t("magicLinkSent", "We've sent a magic link to")} <strong>{sentEmail}</strong>
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="magic-email"
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

      <p className="text-xs text-muted-foreground">
        {t("magicLinkDescription", "We'll send you a link to sign in without a password")}
      </p>

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="h-4 w-4 mr-2" />
        )}
        {t("sendMagicLink", "Send Magic Link")}
      </Button>
    </form>
  );
}
