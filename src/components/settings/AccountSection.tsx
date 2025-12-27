/**
 * Account Section Component
 * 
 * Displays user account info and sign out option.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LogOut, Loader2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export function AccountSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

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

        <div className="pt-4 border-t">
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
