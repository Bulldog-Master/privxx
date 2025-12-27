/**
 * Reset Password Form Component
 * 
 * Allows user to set a new password with Zod validation.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordValues } from "../validation/schemas";
import type { AuthMode } from "../hooks/useAuthMode";

interface ResetPasswordFormProps {
  onModeChange: (mode: AuthMode) => void;
}

export function ResetPasswordForm({ onModeChange }: ResetPasswordFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [updated, setUpdated] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: ResetPasswordValues) => {
    setServerError(null);
    const result = await updatePassword(values.password);
    if (result.error) {
      setServerError(result.error);
    } else {
      setUpdated(true);
      toast.success(t("passwordUpdated", "Password updated successfully"));
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">{t("newPassword", "New Password")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            {...form.register("password")}
            placeholder={t("newPasswordPlaceholder", "Enter new password")}
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
        {form.formState.errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("confirmPassword", "Confirm Password")}</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            {...form.register("confirmPassword")}
            placeholder={t("confirmPasswordPlaceholder", "Confirm new password")}
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
        {form.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.confirmPassword.message}
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
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        {t("updatePassword", "Update Password")}
      </Button>
    </form>
  );
}
