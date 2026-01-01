/**
 * Sign In Form Component
 * 
 * Email/password sign-in with Zod validation.
 * Includes Cloudflare Turnstile CAPTCHA after 3 failed attempts.
 * Features password visibility toggle.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Loader2, ArrowRight, ShieldAlert, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useFailedAttempts } from "@/hooks/useFailedAttempts";
import { supabase } from "@/integrations/supabase/client";
import { signInSchema, type SignInValues } from "../validation/schemas";
import type { AuthMode } from "../hooks/useAuthMode";

interface SignInFormProps {
  onModeChange: (mode: AuthMode) => void;
}

export function SignInForm({ onModeChange }: SignInFormProps) {
  const { t } = useTranslation();
  const { signInWithEmail } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isVerifyingCaptcha, setIsVerifyingCaptcha] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    requiresCaptcha,
    recordFailedAttempt,
    clearAttempts,
    updateCaptchaRequirement,
    threshold,
  } = useFailedAttempts();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;
  const currentEmail = form.watch("email");

  // Check if CAPTCHA is required when email changes
  useEffect(() => {
    if (currentEmail) {
      updateCaptchaRequirement(currentEmail);
    }
  }, [currentEmail, updateCaptchaRequirement]);

  const verifyTurnstileToken = async (token: string): Promise<boolean> => {
    try {
      setIsVerifyingCaptcha(true);
      const { data, error } = await supabase.functions.invoke("verify-turnstile", {
        body: { token },
      });

      if (error) {
        console.error("Turnstile verification error:", error);
        return false;
      }

      return data?.success === true;
    } catch (err) {
      console.error("Failed to verify turnstile:", err);
      return false;
    } finally {
      setIsVerifyingCaptcha(false);
    }
  };

  const onSubmit = async (values: SignInValues) => {
    setServerError(null);

    // If CAPTCHA is required, verify it first
    if (requiresCaptcha) {
      if (!turnstileToken) {
        setServerError(t("captchaRequired", "Please complete the security verification"));
        return;
      }

      const isValidCaptcha = await verifyTurnstileToken(turnstileToken);
      if (!isValidCaptcha) {
        setServerError(t("captchaFailed", "Security verification failed. Please try again."));
        setTurnstileToken(null);
        setResetTrigger(prev => prev + 1);
        return;
      }
    }

    const result = await signInWithEmail(values.email, values.password);
    
    if (result.error) {
      // Record the failed attempt
      const needsCaptcha = recordFailedAttempt(values.email);
      
      if (needsCaptcha && !requiresCaptcha) {
        // Just crossed the threshold, show CAPTCHA message
        setServerError(t("tooManyAttempts", "Too many failed attempts. Please complete the security verification."));
      } else {
        setServerError(result.error);
      }
      
      // Reset CAPTCHA for next attempt
      setTurnstileToken(null);
      setResetTrigger(prev => prev + 1);
    } else {
      // Clear attempts on successful login
      clearAttempts(values.email);
    }
  };

  const handleTurnstileVerify = (token: string) => {
    setTurnstileToken(token);
    setServerError(null);
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setServerError(t("captchaError", "Security verification error. Please refresh and try again."));
  };

  const handleTurnstileExpire = () => {
    setTurnstileToken(null);
    setServerError(t("captchaExpired", "Security verification expired. Please complete it again."));
  };

  const isFormDisabled = isSubmitting || isVerifyingCaptcha;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{t("email", "Email")}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            placeholder={t("emailPlaceholder", "you@example.com")}
            className="pl-10"
            disabled={isFormDisabled}
          />
        </div>
        {form.formState.errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("password", "Password")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            {...form.register("password")}
            placeholder={t("passwordPlaceholder", "Enter your password")}
            className="pl-10 pr-10"
            disabled={isFormDisabled}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? t("hidePassword", "Hide password") : t("showPassword", "Show password")}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      {/* Turnstile CAPTCHA - shown after threshold failed attempts */}
      {requiresCaptcha && (
        <div className="space-y-2 p-4 rounded-lg border border-border bg-muted/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{t("securityVerification", "Security verification required")}</span>
          </div>
          <TurnstileWidget
            onVerify={handleTurnstileVerify}
            onError={handleTurnstileError}
            onExpire={handleTurnstileExpire}
            resetTrigger={resetTrigger}
          />
          {turnstileToken && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              {t("verificationComplete", "✓ Verification complete")}
            </p>
          )}
        </div>
      )}

      {serverError && (
        <p className="text-sm text-destructive">{serverError}</p>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={isFormDisabled || (requiresCaptcha && !turnstileToken)}
      >
        {isFormDisabled ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <ArrowRight className="h-4 w-4 mr-2" />
        )}
        {t("signIn", "Sign In")}
      </Button>

      <Button 
        type="button"
        variant="link" 
        onClick={() => onModeChange("forgot")}
        className="w-full text-sm"
      >
        {t("forgotPassword", "Forgot Password?")}
      </Button>
    </form>
  );
}
