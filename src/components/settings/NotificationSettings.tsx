/**
 * Notification Settings Component
 * 
 * Allows users to manage their notification preferences.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bell, Shield, Wifi, Mail, Send, Loader2, Smartphone, History, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useSecurityNotify } from "@/hooks/useSecurityNotify";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { toast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

// Security-related event types for notification history
const NOTIFICATION_EVENT_TYPES = [
  "auth_password_reset_complete",
  "passkey_registration_complete",
  "totp_setup_complete",
  "totp_backup_code_used",
];

export function NotificationSettings() {
  const { t } = useTranslation("ui");
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();
  const { notify } = useSecurityNotify();
  const { logs, isLoading: isLoadingLogs } = useAuditLogs();
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Filter logs to only show notification-related events
  const notificationHistory = logs
    .filter((log) => NOTIFICATION_EVENT_TYPES.includes(log.event_type))
    .slice(0, 10);

  const handleToggle = async (
    key: "session_warnings" | "security_alerts" | "connection_updates" | "new_device_login",
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

  const getEventLabel = (eventType: string): string => {
    const labels: Record<string, string> = {
      auth_password_reset_complete: t("passwordChanged", "Password changed"),
      passkey_registration_complete: t("passkeyAdded", "Passkey added"),
      totp_setup_complete: t("twoFactorEnabled", "2FA enabled"),
      totp_backup_code_used: t("backupCodeUsed", "Backup code used"),
    };
    return labels[eventType] || eventType;
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

        {/* New Device Login Alerts */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Smartphone className="h-5 w-5 text-primary/70 mt-0.5" />
              <Mail className="h-3 w-3 text-primary/50 absolute -bottom-0.5 -right-1" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="new-device-login" className="text-sm font-medium text-primary">
                  {t("newDeviceLogin", "New device login alerts")}
                </Label>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-primary/60 border-primary/20">
                  <Mail className="h-2.5 w-2.5 mr-0.5" />
                  Email
                </Badge>
              </div>
              <p className="text-xs text-primary/70">
                {t("newDeviceLoginDesc", "Get notified when your account is accessed from a new device")}
              </p>
            </div>
          </div>
          <Switch
            id="new-device-login"
            checked={preferences?.new_device_login ?? true}
            onCheckedChange={(checked) => handleToggle("new_device_login", checked)}
          />
        </div>

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

        <Separator className="my-4" />

        {/* Notification History */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full justify-between text-primary/80 hover:text-primary"
          >
            <span className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t("notificationHistory", "Notification history")}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              {notificationHistory.length}
            </Badge>
          </Button>

          {showHistory && (
            <div className="rounded-md border border-border/50 bg-background/50">
              {isLoadingLogs ? (
                <div className="p-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : notificationHistory.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {t("noNotifications", "No recent security notifications")}
                </div>
              ) : (
                <ScrollArea className="h-[200px]">
                  <div className="p-2 space-y-1">
                    {notificationHistory.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        {log.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-primary truncate">
                            {getEventLabel(log.event_type)}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
