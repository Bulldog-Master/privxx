/**
 * Reset Password Form Component
 * 
 * Allows user to set a new password after clicking reset link.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { AuthMode } from "../hooks/useAuthMode";

interface ResetPasswordFormProps {
  onModeChange: (mode: AuthMode) => void;
}

export function ResetPasswordForm({ onModeChange }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
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
        setUpdated(true);
        toast.success(t("passwordUpdated", "Password updated successfully"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (updated) {
    return (
      <div className="text-center py-6 space-y-4">
        <CheckCircle className="h-12 w-12 mx-auto text-emerald-500" />
        <h3 className="font-medium">{t("passwordUpdatedTitle", "Password Updated!")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("passwordUpdatedDesc", "Your password has been successfully updated.")}
        </p>
        <Button 
          onClick={() => { 
            onModeChange("signin"); 
            setUpdated(false); 
            navigate("/auth"); 
          }} 
          className="mt-4"
        >
          {t("signIn", "Sign In")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
  );
}
