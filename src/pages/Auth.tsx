/**
 * Auth Page (Refactored)
 * 
 * Thin orchestrator that renders the appropriate auth form based on mode.
 * All form logic is now in src/features/auth/components/.
 * 
 * IMPORTANT: The 2FA challenge flow blocks automatic redirect until verified.
 * When a user signs in and has 2FA enabled, the SignInForm will call
 * onRequires2FA(true) which sets pending2FA state and prevents redirect.
 */

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Sparkles, Fingerprint } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePasskey } from "@/features/auth";
import { PageBackground } from "@/components/layout/PageBackground";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PrivxxLogo } from "@/components/brand";
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
  
  // Block redirect while 2FA challenge is pending
  const [pending2FA, setPending2FA] = useState(false);

  // Get the redirect destination from location state (set by ProtectedRoute)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Callback for SignInForm to notify when 2FA is required
  const handleRequires2FA = useCallback((requires: boolean) => {
    console.log("[Auth] 2FA requirement changed:", requires);
    setPending2FA(requires);
  }, []);

  // Redirect if already authenticated (but not during password reset or 2FA challenge)
  useEffect(() => {
    if (isAuthenticated && !authLoading && mode !== "reset" && !pending2FA) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, mode, from, pending2FA]);

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
              <SignInForm onModeChange={setMode} onRequires2FA={handleRequires2FA} />
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
