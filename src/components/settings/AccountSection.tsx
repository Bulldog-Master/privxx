/**
 * Account Section Component
 * 
 * Displays user account info, auth methods, password management, and sign out option.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Loader2, User, KeyRound, Check, Sparkles, Fingerprint, Shield, Smartphone, Settings2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface AuthMethods {
  password: boolean;
  magicLink: boolean;
  passkey: boolean;
  passkeyCount: number;
  totp: boolean;
}

export function AccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordAction, setPasswordAction] = useState<"set" | "change">("set");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [authMethods, setAuthMethods] = useState<AuthMethods>({
    password: false,
    magicLink: true,
    passkey: false,
    passkeyCount: 0,
    totp: false,
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  useEffect(() => {
    const checkAuthMethods = async () => {
      if (!user) return;
      setIsCheckingAuth(true);
      
      try {
        // Check for password auth via identities
        const { data: identityData } = await supabase.auth.getUserIdentities();
        const hasEmailProvider = identityData?.identities?.some(
          (id) => id.provider === "email"
        ) ?? false;
        
        // Check for passkeys
        const { count: passkeyCount } = await supabase
          .from("passkey_credentials")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        // Check for TOTP
        const { data: totpData } = await supabase
          .from("totp_secrets")
          .select("enabled")
          .eq("user_id", user.id)
          .maybeSingle();
        
        setAuthMethods({
          password: hasEmailProvider,
          magicLink: true,
          passkey: (passkeyCount ?? 0) > 0,
          passkeyCount: passkeyCount ?? 0,
          totp: totpData?.enabled ?? false,
        });
      } catch (error) {
        console.error("Error checking auth methods:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };
    
    checkAuthMethods();
  }, [user]);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      toast.success(t("signedOut", "Signed out successfully"));
      navigate("/auth");
    } catch (error) {
      toast.error(t("signOutError", "Failed to sign out"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (newPassword.length < 8) {
      toast.error(t("passwordTooShort", "Password must be at least 8 characters"));
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error(t("passwordsMismatch", "Passwords do not match"));
      return;
    }
    
    setIsSettingPassword(true);
    try {
      // For changing password, verify current password first
      if (passwordAction === "change" && currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user?.email ?? "",
          password: currentPassword,
        });
        
        if (signInError) {
          toast.error(t("currentPasswordIncorrect", "Current password is incorrect"));
          setIsSettingPassword(false);
          return;
        }
      }
      
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      const successMsg = passwordAction === "set" 
        ? t("passwordSet", "Password set successfully! You can now sign in with email and password.")
        : t("passwordChanged", "Password changed successfully!");
      
      toast.success(successMsg);
      resetPasswordForm();
      setAuthMethods(prev => ({ ...prev, password: true }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update password";
      toast.error(message);
    } finally {
      setIsSettingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setShowPasswordForm(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const openPasswordForm = (action: "set" | "change") => {
    setPasswordAction(action);
    setShowPasswordForm(true);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <User className="h-5 w-5" />
          {t("account", "Account")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("accountDescription", "Manage your account settings")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t("email", "Email")}</p>
            <p className="text-sm text-primary/70">{user?.email}</p>
          </div>
        </div>

        {/* Authentication Methods Display */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-primary">
                {t("authMethods", "Authentication Methods")}
              </p>
            </div>
          </div>
          
          {isCheckingAuth ? (
            <div className="flex items-center gap-2 text-primary/60">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t("checking", "Checking...")}</span>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Auth method badges */}
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={authMethods.password ? "default" : "outline"}
                  className={authMethods.password ? "bg-green-600/20 text-green-400 border-green-500/30" : "opacity-50"}
                >
                  <KeyRound className="h-3 w-3 mr-1" />
                  {t("password", "Password")}
                  {authMethods.password && <Check className="h-3 w-3 ml-1" />}
                </Badge>
                
                <Badge 
                  variant="default"
                  className="bg-blue-600/20 text-blue-400 border-blue-500/30"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t("magicLink", "Magic Link")}
                  <Check className="h-3 w-3 ml-1" />
                </Badge>
                
                <Badge 
                  variant={authMethods.passkey ? "default" : "outline"}
                  className={authMethods.passkey ? "bg-purple-600/20 text-purple-400 border-purple-500/30" : "opacity-50"}
                >
                  <Fingerprint className="h-3 w-3 mr-1" />
                  {t("passkey", "Passkey")}
                  {authMethods.passkey && (
                    <>
                      <span className="mx-1">({authMethods.passkeyCount})</span>
                      <Check className="h-3 w-3" />
                    </>
                  )}
                </Badge>
                
                <Badge 
                  variant={authMethods.totp ? "default" : "outline"}
                  className={authMethods.totp ? "bg-amber-600/20 text-amber-400 border-amber-500/30" : "opacity-50"}
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  {t("totp2FA", "2FA (TOTP)")}
                  {authMethods.totp && <Check className="h-3 w-3 ml-1" />}
                </Badge>
              </div>

              {/* Manage links */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary/60 hover:text-primary"
                  onClick={() => scrollToSection("passkey-section")}
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  {t("managePasskeys", "Manage Passkeys")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary/60 hover:text-primary"
                  onClick={() => scrollToSection("totp-section")}
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  {t("manage2FA", "Manage 2FA")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-primary/60 hover:text-primary"
                  onClick={() => scrollToSection("recovery-section")}
                >
                  <Settings2 className="h-3 w-3 mr-1" />
                  {t("recoveryCodes", "Recovery Codes")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Password Management Section */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-primary flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                {t("passwordManagement", "Password")}
              </p>
              <p className="text-xs text-primary/60">
                {authMethods.password 
                  ? t("passwordSetDesc", "You have password login enabled.")
                  : t("noPasswordSet", "Set a password to enable email/password login.")}
              </p>
            </div>
          </div>
          
          {!showPasswordForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openPasswordForm(authMethods.password ? "change" : "set")}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {authMethods.password 
                ? t("changePassword", "Change Password") 
                : t("setPassword", "Set Password")}
            </Button>
          ) : (
            <div className="space-y-3">
              {/* Current password field - only for changing */}
              {passwordAction === "change" && (
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-primary/80">
                    {t("currentPassword", "Current Password")}
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder={t("enterCurrentPassword", "Enter current password")}
                    className="bg-background/50"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-primary/80">
                  {t("newPassword", "New Password")}
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("enterNewPassword", "Enter new password (min 8 chars)")}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-primary/80">
                  {t("confirmPassword", "Confirm Password")}
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("confirmNewPassword", "Confirm new password")}
                  className="bg-background/50"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePasswordSubmit}
                  disabled={isSettingPassword || newPassword.length < 8 || (passwordAction === "change" && !currentPassword)}
                >
                  {isSettingPassword ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {passwordAction === "set" 
                    ? t("savePassword", "Save Password")
                    : t("updatePassword", "Update Password")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetPasswordForm}
                >
                  {t("cancel", "Cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sign Out */}
        <div className="pt-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={handleSignOut}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <LogOut className="h-4 w-4 mr-2" />
            )}
            {t("signOut", "Sign Out")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
