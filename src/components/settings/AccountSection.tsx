/**
 * Account Section Component
 * 
 * Displays user account info, password management, and sign out option.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Loader2, User, KeyRound, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function AccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Check if user signed up via magic link (no password provider)
  const [hasPasswordAuth, setHasPasswordAuth] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAuthMethod = async () => {
      if (!user) return;
      
      // Get user identities to check auth providers
      const { data } = await supabase.auth.getUserIdentities();
      const hasEmailProvider = data?.identities?.some(
        (id) => id.provider === "email"
      );
      setHasPasswordAuth(hasEmailProvider ?? false);
    };
    
    checkAuthMethod();
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

  const handleSetPassword = async () => {
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
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success(t("passwordSet", "Password set successfully! You can now sign in with email and password."));
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
      setHasPasswordAuth(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to set password";
      toast.error(message);
    } finally {
      setIsSettingPassword(false);
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-primary">{t("email", "Email")}</p>
            <p className="text-sm text-primary/70">{user?.email}</p>
          </div>
        </div>

        {/* Password Section - Show if user doesn't have password auth */}
        {hasPasswordAuth === false && (
          <div className="pt-4 border-t border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-primary flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  {t("passwordLogin", "Password Login")}
                </p>
                <p className="text-xs text-primary/60">
                  {t("noPasswordSet", "You signed up via Magic Link. Set a password to enable email/password login.")}
                </p>
              </div>
            </div>
            
            {!showPasswordForm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordForm(true)}
              >
                <KeyRound className="h-4 w-4 mr-2" />
                {t("setPassword", "Set Password")}
              </Button>
            ) : (
              <div className="space-y-3">
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
                    onClick={handleSetPassword}
                    disabled={isSettingPassword || newPassword.length < 8}
                  >
                    {isSettingPassword ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    {t("savePassword", "Save Password")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setNewPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    {t("cancel", "Cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Show confirmation if password is set */}
        {hasPasswordAuth === true && (
          <div className="pt-4 border-t border-border/50">
            <p className="text-sm text-primary/70 flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              {t("passwordEnabled", "Password login enabled")}
            </p>
          </div>
        )}

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
