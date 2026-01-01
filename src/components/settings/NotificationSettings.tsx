/**
 * Notification Settings Component
 * 
 * Allows users to manage their notification preferences.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Shield, Wifi, Mail, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSecurityNotify } from "@/hooks/useSecurityNotify";
import { toast } from "@/hooks/useToast";

export function NotificationSettings() {
  const { t } = useTranslation("ui");
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();
  const { notify } = useSecurityNotify();
  const [isSendingTest, setIsSendingTest] = useState(false);

  const handleToggle = async (
    key: "session_warnings" | "security_alerts" | "connection_updates",
    checked: boolean
  ) => {
    try {
      await updatePreference(key, checked);
      toast({
        title: t("preferenceUpdated", "Preference updated"),
        description: t("notificationSettingSaved", "Your notification setting has been saved."),
      });
    } catch {
      toast({
        title: t("error", "Error"),
        description: t("failedToUpdatePreference", "Failed to update preference. Please try again."),
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Bell className="h-5 w-5" />
          {t("notifications", "Notifications")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("notificationsDesc", "Choose which notifications you want to receive")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Warnings */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary/70 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="session-warnings" className="text-sm font-medium text-primary">
                {t("sessionWarnings", "Session warnings")}
              </Label>
              <p className="text-xs text-primary/70">
                {t("sessionWarningsDesc", "Get warned before your session expires")}
              </p>
            </div>
          </div>
          <Switch
            id="session-warnings"
            checked={preferences?.session_warnings ?? true}
            onCheckedChange={(checked) => handleToggle("session_warnings", checked)}
          />
        </div>

        {/* Security Alerts (Email) */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Shield className="h-5 w-5 text-primary/70 mt-0.5" />
              <Mail className="h-3 w-3 text-primary/50 absolute -bottom-0.5 -right-1" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="security-alerts" className="text-sm font-medium text-primary">
                  {t("securityAlerts", "Security email alerts")}
                </Label>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-primary/60 border-primary/20">
                  <Mail className="h-2.5 w-2.5 mr-0.5" />
                  Email
                </Badge>
              </div>
              <p className="text-xs text-primary/70">
                {t("securityAlertsDesc", "Receive emails when passwords, 2FA, or passkeys change")}
              </p>
            </div>
          </div>
          <Switch
            id="security-alerts"
            checked={preferences?.security_alerts ?? true}
            onCheckedChange={(checked) => handleToggle("security_alerts", checked)}
          />
        </div>

        {/* Test Security Email Button */}
        {(preferences?.security_alerts ?? true) && (
          <div className="pl-8 pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsSendingTest(true);
                const success = await notify("password_changed", { test: true });
                setIsSendingTest(false);
                if (success) {
                  toast({
                    title: t("testEmailSent", "Test email sent"),
                    description: t("testEmailSentDesc", "Check your inbox for the security notification."),
                  });
                } else {
                  toast({
                    title: t("testEmailFailed", "Failed to send"),
                    description: t("testEmailFailedDesc", "Could not send test email. Please try again."),
                    variant: "destructive",
                  });
                }
              }}
              disabled={isSendingTest}
              className="text-xs h-7"
            >
              {isSendingTest ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
              ) : (
                <Send className="h-3 w-3 mr-1.5" />
              )}
              {t("sendTestEmail", "Send test email")}
            </Button>
          </div>
        )}

        {/* Connection Updates */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 text-primary/70 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="connection-updates" className="text-sm font-medium text-primary">
                {t("connectionUpdates", "Connection updates")}
              </Label>
              <p className="text-xs text-primary/70">
                {t("connectionUpdatesDesc", "Get notified when tunnel connection status changes")}
              </p>
            </div>
          </div>
          <Switch
            id="connection-updates"
            checked={preferences?.connection_updates ?? false}
            onCheckedChange={(checked) => handleToggle("connection_updates", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
