/**
 * Auth Page
 * 
 * Handles user authentication with email/password and magic link options.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PrivxxLogo from "@/components/PrivxxLogo";

type AuthMode = "signin" | "signup" | "magic-link";

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, signInWithEmail, signUpWithEmail, signInWithMagicLink } = useAuth();

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

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
            <Tabs value={mode} onValueChange={(v) => { setMode(v as AuthMode); setError(null); setMagicLinkSent(false); }}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="signin">{t("signIn", "Sign In")}</TabsTrigger>
                <TabsTrigger value="signup">{t("signUp", "Sign Up")}</TabsTrigger>
                <TabsTrigger value="magic-link">
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  {t("magicLink", "Magic")}
                </TabsTrigger>
              </TabsList>

              {/* Email/Password Forms */}
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
                </form>
              </TabsContent>

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

              {/* Magic Link Form */}
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
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t("privacyNotice", "Your identity is protected by quantum-resistant cryptography")}
        </p>
      </div>
    </div>
  );
}
