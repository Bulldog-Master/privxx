/**
 * Auth Page
 * 
 * Handles user authentication with email/password, magic link, passkey, and password reset.
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Loader2, ArrowRight, Sparkles, Fingerprint, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePasskey } from "@/hooks/usePasskey";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrivxxLogo from "@/components/PrivxxLogo";
import { toast } from "sonner";

type AuthMode = "signin" | "signup" | "magic-link" | "passkey" | "forgot" | "reset";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading: authLoading, signInWithEmail, signUpWithEmail, signInWithMagicLink, resetPassword, updatePassword } = useAuth();
  const { isSupported: passkeySupported, authenticateWithPasskey, isLoading: passkeyLoading, error: passkeyError, clearError: clearPasskeyError } = usePasskey();

  // Check if returning from password reset link
  const resetMode = searchParams.get("mode") === "reset";

  const [mode, setMode] = useState<AuthMode>(resetMode ? "reset" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  // Redirect if already authenticated (but not during password reset)
  useEffect(() => {
    if (isAuthenticated && !authLoading && mode !== "reset") {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate, mode]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = mode === "signin" 
        ? await signInWithEmail(email, password)
        : await signUpWithEmail(email, password);

      if (result.error) {
        setError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInWithMagicLink(email);
      if (result.error) {
        setError(result.error);
      } else {
        setMagicLinkSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearPasskeyError();

    if (!email) {
      setError(t("emailRequired", "Email is required"));
      return;
    }

    const success = await authenticateWithPasskey(email);
    if (success) {
      toast.success(t("passkeyAuthSuccess", "Signed in with passkey"));
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await resetPassword(email);
      if (result.error) {
        setError(result.error);
      } else {
        setResetEmailSent(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordsDoNotMatch", "Passwords do not match"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort", "Password must be at least 6 characters"));
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        setPasswordUpdated(true);
        toast.success(t("passwordUpdated", "Password updated successfully"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as AuthMode);
    setError(null);
    setMagicLinkSent(false);
    setResetEmailSent(false);
    clearPasskeyError();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(215_25%_27%)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(215_25%_27%)] px-4 relative overflow-hidden">
      {/* Background elements */}
      <div 
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-90"
        style={{ 
          background: 'radial-gradient(circle, hsl(172 60% 45%) 0%, hsl(172 50% 35%) 70%, transparent 100%)' 
        }}
      />
      <div 
        className="absolute bottom-0 left-0 right-0 h-64 opacity-60"
        style={{ 
          background: 'linear-gradient(90deg, hsl(340 70% 50%) 0%, hsl(45 80% 55%) 50%, hsl(172 60% 45%) 100%)',
          filter: 'blur(80px)'
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <PrivxxLogo size="lg" />
        </div>

        {/* Password Reset Mode */}
        {mode === "reset" ? (
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {t("resetPassword", "Reset Password")}
              </CardTitle>
              <CardDescription>
                {t("resetPasswordDesc", "Enter your new password below")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordUpdated ? (
                <div className="text-center py-6 space-y-4">
                  <CheckCircle className="h-12 w-12 mx-auto text-emerald-500" />
                  <h3 className="font-medium">{t("passwordUpdatedTitle", "Password Updated!")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("passwordUpdatedDesc", "Your password has been successfully updated.")}
                  </p>
                  <Button onClick={() => { setMode("signin"); setPasswordUpdated(false); navigate("/auth"); }} className="mt-4">
                    {t("signIn", "Sign In")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{t("newPassword", "New Password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("newPasswordPlaceholder", "Enter new password")}
                        className="pl-10"
                        required
                        disabled={isLoading}
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">{t("confirmPassword", "Confirm Password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t("confirmPasswordPlaceholder", "Confirm new password")}
                        className="pl-10"
                        required
                        disabled={isLoading}
                        minLength={6}
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
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t("updatePassword", "Update Password")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : mode === "forgot" ? (
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {t("forgotPassword", "Forgot Password")}
              </CardTitle>
              <CardDescription>
                {t("forgotPasswordDesc", "Enter your email and we'll send you a reset link")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resetEmailSent ? (
                <div className="text-center py-6 space-y-3">
                  <Mail className="h-12 w-12 mx-auto text-primary" />
                  <h3 className="font-medium">{t("checkYourEmail", "Check your email")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("resetLinkSent", "We've sent a password reset link to")} <strong>{email}</strong>
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => { setResetEmailSent(false); setMode("signin"); }}
                    className="mt-4"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("backToSignIn", "Back to Sign In")}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
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
                    onClick={() => setMode("signin")}
                    className="w-full"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    {t("backToSignIn", "Back to Sign In")}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                {t("authWelcome", "Welcome to Privxx")}
              </CardTitle>
              <CardDescription>
                {t("authSubtitle", "Privacy-first messaging powered by XX Network")}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs value={mode} onValueChange={handleModeChange}>
                <TabsList className="grid w-full grid-cols-4 mb-6">
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

              {/* Email/Password Sign In */}
              <TabsContent value="signin">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email", "Email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
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

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password", "Password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("passwordPlaceholder", "Enter your password")}
                        className="pl-10"
                        required
                        disabled={isLoading}
                        minLength={6}
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
                        <ArrowRight className="h-4 w-4 mr-2" />
                      )}
                      {t("signIn", "Sign In")}
                    </Button>

                    <Button 
                      type="button"
                      variant="link" 
                      onClick={() => setMode("forgot")}
                      className="w-full text-sm"
                    >
                      {t("forgotPassword", "Forgot Password?")}
                    </Button>
                  </form>
                </TabsContent>

              {/* Sign Up */}
              <TabsContent value="signup">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t("email", "Email")}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
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

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t("password", "Password")}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t("createPasswordPlaceholder", "Create a password (min 6 chars)")}
                        className="pl-10"
                        required
                        disabled={isLoading}
                        minLength={6}
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
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {t("createAccount", "Create Account")}
                  </Button>
                </form>
              </TabsContent>

              {/* Magic Link */}
              <TabsContent value="magic-link">
                {magicLinkSent ? (
                  <div className="text-center py-6 space-y-3">
                    <Mail className="h-12 w-12 mx-auto text-primary" />
                    <h3 className="font-medium">{t("checkYourEmail", "Check your email")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("magicLinkSent", "We've sent a magic link to")} <strong>{email}</strong>
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setMagicLinkSent(false)}
                      className="mt-4"
                    >
                      {t("tryDifferentEmail", "Try different email")}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleMagicLink} className="space-y-4">
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

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      {t("sendMagicLink", "Send Magic Link")}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      {t("magicLinkDesc", "No password needed. We'll email you a secure link to sign in.")}
                    </p>
                  </form>
                )}
              </TabsContent>

              {/* Passkey */}
              {passkeySupported && (
                <TabsContent value="passkey">
                  <form onSubmit={handlePasskeyAuth} className="space-y-4">
                    <div className="text-center mb-4">
                      <KeyRound className="h-12 w-12 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {t("passkeyDesc", "Sign in with Touch ID, Face ID, Windows Hello, or security key")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="passkey-email">{t("email", "Email")}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="passkey-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("emailPlaceholder", "you@example.com")}
                          className="pl-10"
                          required
                          disabled={passkeyLoading}
                        />
                      </div>
                    </div>

                    {(error || passkeyError) && (
                      <p className="text-sm text-destructive">{error || passkeyError}</p>
                    )}

                    <Button type="submit" className="w-full" disabled={passkeyLoading}>
                      {passkeyLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Fingerprint className="h-4 w-4 mr-2" />
                      )}
                      {t("signInWithPasskey", "Sign in with Passkey")}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      {t("passkeyNote", "You must register a passkey first from your account settings.")}
                    </p>
                  </form>
                </TabsContent>
              )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("privacyNotice", "Your identity is protected by quantum-resistant cryptography")}
        </p>
      </div>
    </div>
  );
}
