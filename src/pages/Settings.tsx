/**
 * User Settings Page
 * 
 * Allows users to manage their account and passkeys.
 */

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageBackground } from "@/components/layout/PageBackground";
import { PrivxxLogo } from "@/components/brand";
import { PasskeyManagement } from "@/components/settings/PasskeyManagement";
import { TOTPManagement } from "@/components/settings/TOTPManagement";
import { AccountSection } from "@/components/settings/AccountSection";
import { SessionSettings } from "@/components/settings/SessionSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AlertSettings } from "@/components/settings/AlertSettings";
import { AuditLogSection } from "@/components/settings/AuditLogSection";

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // ProtectedRoute handles auth check, but we need user for rendering
  if (!user) {
    return null;
  }

  return (
    <PageBackground>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild className="text-primary hover:text-primary/80">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-primary">{t("settings", "Settings")}</h1>
            <p className="text-sm text-primary/70">{user.email}</p>
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
                    <p className="font-medium text-primary">{t("editProfile", "Edit Profile")}</p>
                    <p className="text-sm text-primary/70">{t("editProfileDesc", "Change your display name and avatar")}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/70" />
              </CardContent>
            </Link>
          </Card>

          {/* Account Section */}
          <AccountSection />

          {/* Session Settings */}
          <SessionSettings />

          {/* Notification Preferences */}
          <NotificationSettings />

          {/* Alert Settings (Sound/Vibration) */}
          <AlertSettings />

          {/* Two-Factor Authentication */}
          <TOTPManagement userId={user.id} />

          {/* Passkey Management */}
          <PasskeyManagement userId={user.id} email={user.email || ""} />

          {/* Security Audit Log */}
          <AuditLogSection />
        </div>

        {/* Footer */}
        <div className="mt-12 flex justify-center">
          <PrivxxLogo size="sm" />
        </div>
      </div>
    </PageBackground>
  );
}
