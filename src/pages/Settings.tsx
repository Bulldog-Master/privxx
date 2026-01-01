/**
 * User Settings Page
 * 
 * Allows users to manage their account and passkeys.
 */

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, ChevronRight, Shield, HeartPulse, Activity } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageBackground } from "@/components/layout/PageBackground";
import { BuildVersionBadge, StaleBuildWarning } from "@/components/shared";
import { PrivxxLogo } from "@/components/brand";
import { AuthServiceDiagnostics } from "@/components/settings/AuthServiceDiagnostics";
import { BackendHealthPanel } from "@/components/settings/BackendHealthPanel";
import { ForceRefreshCard } from "@/components/settings/ForceRefreshCard";
import { PasskeyManagement } from "@/components/settings/PasskeyManagement";
import { PasskeyGuidedFlow } from "@/components/settings/PasskeyGuidedFlow";
import { TOTPManagement } from "@/components/settings/TOTPManagement";
import { RecoveryCodesManagement } from "@/components/settings/RecoveryCodesManagement";
import { SecurityChecklist } from "@/components/settings/SecurityChecklist";
import { SecurityScoreIndicator } from "@/components/settings/SecurityScoreIndicator";
import { EnhancedAuthDebugBundle } from "@/components/settings/EnhancedAuthDebugBundle";
import { AccountSection } from "@/components/settings/AccountSection";
import { SessionSettings } from "@/components/settings/SessionSettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { PushNotificationSettings } from "@/components/settings/PushNotificationSettings";
import { NotificationDigestSettings } from "@/components/settings/NotificationDigestSettings";
import { NotificationChannelSettings } from "@/components/settings/NotificationChannelSettings";
import { NotificationSoundSettings } from "@/components/settings/NotificationSoundSettings";
import { KnownDevicesManagement } from "@/components/settings/KnownDevicesManagement";
import { AlertSettings } from "@/components/settings/AlertSettings";
import { ConnectionAlertSettings } from "@/components/settings/ConnectionAlertSettings";
import { ConnectionAlertHistory } from "@/components/settings/ConnectionAlertHistory";
import { buildInfo } from "@/lib/buildInfo";

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Check 2FA status for recovery codes management
  const check2FAStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.functions.invoke("totp-auth", {
        body: { action: "status" },
      });
      setIs2FAEnabled(data?.enabled ?? false);
    } catch {
      setIs2FAEnabled(false);
    }
  }, [user]);

  useEffect(() => {
    check2FAStatus();
  }, [check2FAStatus]);

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
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-primary">{t("settings", "Settings")}</h1>
              <BuildVersionBadge />
            </div>
            <p className="text-sm text-primary/70">{user.email}</p>
          </div>
        </div>

        {/* Stale Build Warning */}
        <StaleBuildWarning />

        {/* Force Refresh (stale cache breaker) */}
        <div className="mt-4">
          <ForceRefreshCard />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t("refresh.iosHint", "On iOS/Safari, close and reopen the app after clearing cache.")}
          </p>
        </div>

        <div className="space-y-6 mt-6">
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

          {/* Push Notifications */}
          <PushNotificationSettings />

          {/* Email Digest Settings */}
          <NotificationDigestSettings />

          {/* Multi-Channel Notification Settings */}
          <NotificationChannelSettings />

          {/* Notification Sound Settings */}
          <NotificationSoundSettings />

          {/* Known Devices Management */}
          <KnownDevicesManagement />

          {/* Alert Settings (Sound/Vibration) */}
          <AlertSettings />

          {/* Connection Quality Alerts */}
          <ConnectionAlertSettings />

          {/* Connection Alert History */}
          <ConnectionAlertHistory />

          {/* Backend Health Panel */}
          <BackendHealthPanel />

          {/* Authentication Services Diagnostics */}
          <AuthServiceDiagnostics />

          {/* Security Score & Checklist */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <SecurityScoreIndicator size="lg" />
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-semibold text-primary mb-1">
                    {t("securityScore.title", "Security Score")}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t("securityScore.description", "Based on your account security settings")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <SecurityChecklist />

          {/* Two-Factor Authentication */}
          <div id="totp-section">
            <TOTPManagement userId={user.id} />
          </div>

          {/* 2FA Recovery Codes */}
          <div id="recovery-section">
            <RecoveryCodesManagement userId={user.id} is2FAEnabled={is2FAEnabled} />
          </div>

          {/* Passkey Management */}
          <div id="passkey-section">
            <PasskeyManagement userId={user.id} email={user.email || ""} />
          </div>

          {/* Passkey Guided Flow */}
          <PasskeyGuidedFlow userId={user.id} />

          {/* Enhanced Auth Debug Bundle */}
          <EnhancedAuthDebugBundle />

          {/* Security Dashboard Link */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <Link to="/security" className="block">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{t("security.dashboardTitle", "Security Dashboard")}</p>
                    <p className="text-sm text-primary/70">{t("security.dashboardDesc", "View audit logs and security activity")}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/70" />
              </CardContent>
            </Link>
          </Card>

          {/* Backend Status Link */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <Link to="/backend-status" className="block">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{t("backendStatus.title", "Backend Status")}</p>
                    <p className="text-sm text-primary/70">{t("backendStatus.settingsDesc", "Check service reachability and CORS")}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/70" />
              </CardContent>
            </Link>
          </Card>

          {/* Health Page Link */}
          <Card className="bg-card/90 backdrop-blur-sm border-border/50">
            <Link to="/health" className="block">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <HeartPulse className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">{t("health.title", "Health")}</p>
                    <p className="text-sm text-primary/70">{t("health.settingsDesc", "Backend connectivity checks & debug report")}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/70" />
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 flex flex-col items-center gap-2">
          <PrivxxLogo size="sm" />
          <p className="text-xs text-muted-foreground font-mono select-all">
            v{buildInfo.version}{buildInfo.build ? `+${buildInfo.build}` : ""}
          </p>
        </div>
      </div>
    </PageBackground>
  );
}
