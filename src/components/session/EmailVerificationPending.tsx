/**
 * Email Verification Pending Component
 * 
 * Shown when a user is authenticated but hasn't verified their email yet.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail, Loader2, CheckCircle, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivxxLogo } from "@/components/brand";
import { toast } from "sonner";

export function EmailVerificationPending() {
  const { t } = useTranslation();
  const { user, resendVerificationEmail, signOut } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResendEmail = async () => {
    setIsResending(true);
    const result = await resendVerificationEmail();
    setIsResending(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      setEmailSent(true);
      toast.success(t("verificationEmailSent", "Verification email sent!"));
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

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

        <Card className="bg-card/90 backdrop-blur-sm border-border/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">
              {t("verifyYourEmail", "Verify Your Email")}
            </CardTitle>
            <CardDescription>
              {t("verificationEmailSentTo", "We've sent a verification email to")}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="font-medium text-foreground break-all">
                {user?.email}
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground space-y-2">
              <p>{t("verificationInstructions", "Please check your inbox and click the verification link to continue.")}</p>
              <p>{t("checkSpamFolder", "Don't forget to check your spam folder if you don't see it.")}</p>
            </div>

            {emailSent ? (
              <div className="flex items-center justify-center gap-2 text-emerald-500">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {t("emailSentAgain", "Email sent! Check your inbox.")}
                </span>
              </div>
            ) : (
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                variant="outline"
                className="w-full"
              >
                {isResending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {t("resendVerificationEmail", "Resend Verification Email")}
              </Button>
            )}

            <div className="border-t border-border pt-4">
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t("signOutAndTryDifferentEmail", "Sign out & use different email")}
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("privacyNotice", "Your identity is protected by quantum-resistant cryptography")}
        </p>
      </div>
    </div>
  );
}
