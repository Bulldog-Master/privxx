/**
 * Auth Page (Refactored)
 * 
 * Thin orchestrator that renders the appropriate auth form based on mode.
 * All form logic is now in src/features/auth/components/.
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePasskey } from "@/hooks/usePasskey";
import { PageBackground } from "@/components/layout/PageBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrivxxLogo from "@/components/PrivxxLogo";
import {
  useAuthMode,
  SignInForm,
  SignUpForm,
  MagicLinkForm,
  PasskeyForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  AuthCard,
} from "@/features/auth";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isSupported: passkeySupported } = usePasskey();
  const { mode, setMode } = useAuthMode();

  // Get the redirect destination from location state (set by ProtectedRoute)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Redirect if already authenticated (but not during password reset)
  useEffect(() => {
    if (isAuthenticated && !authLoading && mode !== "reset") {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, mode, from]);

  if (authLoading) {
    return (
      <PageBackground className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageBackground>
    );
  }

  // Standalone forms (forgot password, reset password)
  if (mode === "forgot") {
    return (
      <PageBackground className="flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <PrivxxLogo size="lg" />
          </div>
          <AuthCard 
            title={t("forgotPassword", "Forgot Password")}
            description={t("forgotPasswordDesc", "Enter your email and we'll send you a reset link")}
          >
            <ForgotPasswordForm onModeChange={setMode} />
          </AuthCard>
        </div>
      </PageBackground>
    );
  }

  if (mode === "reset") {
    return (
      <PageBackground className="flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8">
            <PrivxxLogo size="lg" />
          </div>
          <AuthCard 
            title={t("resetPassword", "Reset Password")}
            description={t("resetPasswordDesc", "Enter your new password below")}
          >
            <ResetPasswordForm onModeChange={setMode} />
          </AuthCard>
        </div>
      </PageBackground>
    );
  }

  // Main auth flow with tabs
  return (
    <PageBackground className="flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <PrivxxLogo size="lg" />
        </div>

        <AuthCard description={t("authSubtitle", "Privacy-first messaging powered by XX Network")}>
          <Tabs value={mode} onValueChange={(m) => setMode(m as typeof mode)}>
            <TabsList className={`grid w-full mb-6 ${passkeySupported ? 'grid-cols-4' : 'grid-cols-3'}`}>
              <TabsTrigger value="signin">{t("signIn", "Sign In")}</TabsTrigger>
              <TabsTrigger value="signup">{t("signUp", "Sign Up")}</TabsTrigger>
              <TabsTrigger value="magic-link">
                <Sparkles className="h-3.5 w-3.5" />
              </TabsTrigger>
              {passkeySupported && (
                <TabsTrigger value="passkey">
                  <Fingerprint className="h-3.5 w-3.5" />
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="signin">
              <SignInForm onModeChange={setMode} />
            </TabsContent>

            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>

            <TabsContent value="magic-link">
              <MagicLinkForm />
            </TabsContent>

            {passkeySupported && (
              <TabsContent value="passkey">
                <PasskeyForm />
              </TabsContent>
            )}
          </Tabs>
        </AuthCard>
      </div>
    </PageBackground>
  );
}
