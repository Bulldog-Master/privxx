/**
 * User Settings Page
 * 
 * Allows users to manage their account and passkeys.
 */

import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Loader2, User, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PrivxxLogo from "@/components/PrivxxLogo";
import { PasskeyManagement } from "@/components/settings/PasskeyManagement";
import { TOTPManagement } from "@/components/settings/TOTPManagement";
import { AccountSection } from "@/components/settings/AccountSection";

export default function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(215_25%_27%)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[hsl(215_25%_27%)] relative overflow-hidden">
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

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("settings", "Settings")}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Profile Link */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <Link to="/profile" className="block">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{t("editProfile", "Edit Profile")}</p>
                    <p className="text-sm text-muted-foreground">{t("editProfileDesc", "Change your display name and avatar")}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>

          {/* Account Section */}
          <AccountSection />

          {/* Two-Factor Authentication */}
          <TOTPManagement userId={user.id} />

          {/* Passkey Management */}
          <PasskeyManagement userId={user.id} email={user.email || ""} />
        </div>

        {/* Footer */}
        <div className="mt-12 flex justify-center">
          <PrivxxLogo size="sm" />
        </div>
      </div>
    </div>
  );
}
