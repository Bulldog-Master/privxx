/**
 * Sign Up Form Component
 * 
 * Email/password registration with Zod validation.
 * Includes password visibility toggle, confirmation field, and referral code support.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, ArrowRight, Check, X, Eye, EyeOff, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { signUpSchema, type SignUpValues } from "../validation/schemas";
import { PasswordStrengthIndicator } from "./PasswordStrengthIndicator";
import { PasswordRequirementsList } from "./PasswordRequirementsList";
import { PasswordGenerator } from "./PasswordGenerator";
import { RevealOnTypeInput } from "./RevealOnTypeInput";

export function SignUpForm() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { signUpWithEmail } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref.toUpperCase());
    }
  }, [searchParams]);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: SignUpValues) => {
    setServerError(null);
    const result = await signUpWithEmail(values.email, values.password, referralCode || undefined);
    if (result.error) {
      setServerError(result.error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Referral Code Display */}
      {referralCode && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary">
            {t("referrals.usingCode", "Using referral code")}:
          </span>
          <Badge variant="secondary" className="font-mono">
            {referralCode}
          </Badge>
        </div>
      )}

      {/* Optional Referral Code Input (if not from URL) */}
      {!searchParams.get("ref") && (
        <div className="space-y-2">
          <Label htmlFor="referral-code" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            {t("referrals.haveCode", "Have a referral code?")}
            <span className="text-xs text-muted-foreground">({t("optional", "optional")})</span>
          </Label>
          <Input
            id="referral-code"
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
            placeholder={t("referrals.enterCode", "Enter code")}
            className="font-mono uppercase"
            maxLength={8}
            disabled={isSubmitting}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="signup-email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-email"
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

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signup-password">{t("password", "Password")}</Label>
          <PasswordGenerator 
            onGenerate={(password) => {
              form.setValue("password", password);
              form.setValue("confirmPassword", password);
              setShowPassword(true);
              setShowConfirmPassword(true);
            }} 
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
          <RevealOnTypeInput
            id="signup-password"
            value={form.watch("password")}
            onChange={(val) => form.setValue("password", val, { shouldValidate: form.formState.isSubmitted })}
            placeholder={t("createPasswordPlaceholder", "Create a password")}
            className="pl-10"
            disabled={isSubmitting}
            showPassword={showPassword}
            onToggleVisibility={() => setShowPassword(!showPassword)}
            revealOnType={!showPassword}
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.password.message}
          </p>
        )}
        <PasswordStrengthIndicator password={form.watch("password")} />
        <PasswordRequirementsList password={form.watch("password")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-confirm-password">{t("confirmPassword", "Confirm Password")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="signup-confirm-password"
            type={showConfirmPassword ? "text" : "password"}
            {...form.register("confirmPassword")}
            placeholder={t("confirmPasswordPlaceholder", "Confirm your password")}
            className="pl-10 pr-16"
            disabled={isSubmitting}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {form.watch("confirmPassword") && (
              form.watch("password") === form.watch("confirmPassword") ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-destructive" />
              )
            )}
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
              aria-label={showConfirmPassword ? t("hidePassword", "Hide password") : t("showPassword", "Show password")}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.confirmPassword.message}
          </p>
        )}
        {form.watch("confirmPassword") && form.watch("password") === form.watch("confirmPassword") && (
          <p className="text-xs text-green-600 dark:text-green-400">
            {t("passwordsMatch", "Passwords match")}
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
          <ArrowRight className="h-4 w-4 mr-2" />
        )}
        {t("signUp", "Sign Up")}
      </Button>
    </form>
  );
}
