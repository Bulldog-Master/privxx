/**
 * Notification Settings Component
 * 
 * Allows users to manage their notification preferences.
 */

import { useTranslation } from "react-i18next";
import { Bell, Shield, Wifi } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { toast } from "@/hooks/use-toast";

export function NotificationSettings() {
  const { t } = useTranslation("ui");
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();

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
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("notifications", "Notifications")}
        </CardTitle>
        <CardDescription>
          {t("notificationsDesc", "Choose which notifications you want to receive")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Warnings */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="session-warnings" className="text-sm font-medium">
                {t("sessionWarnings", "Session warnings")}
              </Label>
              <p className="text-xs text-muted-foreground">
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

        {/* Security Alerts */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="security-alerts" className="text-sm font-medium">
                {t("securityAlerts", "Security alerts")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("securityAlertsDesc", "Get notified about security-related events")}
              </p>
            </div>
          </div>
          <Switch
            id="security-alerts"
            checked={preferences?.security_alerts ?? true}
            onCheckedChange={(checked) => handleToggle("security_alerts", checked)}
          />
        </div>

        {/* Connection Updates */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Wifi className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="connection-updates" className="text-sm font-medium">
                {t("connectionUpdates", "Connection updates")}
              </Label>
              <p className="text-xs text-muted-foreground">
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
