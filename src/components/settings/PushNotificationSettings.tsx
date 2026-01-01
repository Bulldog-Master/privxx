/**
 * Push Notification Settings Component
 * 
 * Manages browser push notification permissions and preferences.
 */

import { useTranslation } from "react-i18next";
import { Bell, BellRing, BellOff, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/useToast";
import { formatDistanceToNow } from "date-fns";

export function PushNotificationSettings() {
  const { t } = useTranslation("ui");
  const {
    isSupported,
    isEnabled,
    permission,
    lastDelivered,
    requestPermission,
    setEnabled,
    showNotification,
  } = usePushNotifications();

  const handleEnableToggle = async (checked: boolean) => {
    if (checked && permission !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        toast({
          title: t("permissionDenied", "Permission denied"),
          description: t("pushPermissionDeniedDesc", "Please enable notifications in your browser settings."),
          variant: "destructive",
        });
        return;
      }
    }
    setEnabled(checked);
    toast({
      title: t("preferenceUpdated", "Preference updated"),
      description: checked
        ? t("pushEnabled", "Push notifications enabled.")
        : t("pushDisabled", "Push notifications disabled."),
    });
  };

  const handleTestNotification = () => {
    const success = showNotification(
      t("testNotificationTitle", "Privxx Security Alert"),
      {
        body: t("testNotificationBody", "This is a test push notification. Your alerts are working!"),
        tag: "test-notification",
      }
    );
    
    if (success) {
      toast({
        title: t("testSent", "Test notification sent"),
        description: t("testSentDesc", "Check your notification area."),
      });
    } else {
      toast({
        title: t("testFailed", "Failed to send"),
        description: t("testFailedDesc", "Could not send test notification."),
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <BellOff className="h-5 w-5" />
            {t("pushNotifications", "Push Notifications")}
          </CardTitle>
          <CardDescription className="text-primary/70">
            {t("pushNotSupported", "Push notifications are not supported in this browser.")}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BellRing className="h-5 w-5" />
          {t("pushNotifications", "Push Notifications")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("pushNotificationsDesc", "Get instant browser alerts for security events")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable Push Notifications */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-primary/70 mt-0.5" />
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="push-enabled" className="text-sm font-medium text-primary">
                  {t("enablePush", "Enable push notifications")}
                </Label>
                {permission === "granted" ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-green-600 border-green-500/30 bg-green-500/10">
                    <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                    {t("granted", "Granted")}
                  </Badge>
                ) : permission === "denied" ? (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-destructive border-destructive/30 bg-destructive/10">
                    <XCircle className="h-2.5 w-2.5 mr-0.5" />
                    {t("blocked", "Blocked")}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground border-muted-foreground/30">
                    {t("notRequested", "Not requested")}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-primary/70">
                {t("enablePushDesc", "Receive browser notifications for important security events")}
              </p>
            </div>
          </div>
          <Switch
            id="push-enabled"
            checked={isEnabled}
            onCheckedChange={handleEnableToggle}
            disabled={permission === "denied"}
          />
        </div>

        {/* Test Push Notification Button */}
        {isEnabled && (
          <div className="flex items-center justify-between pl-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {lastDelivered && (
                <>
                  <Clock className="h-3 w-3" />
                  <span>
                    {t("lastDelivered", "Last delivered")}: {formatDistanceToNow(new Date(lastDelivered), { addSuffix: true })}
                  </span>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="text-xs h-7"
            >
              <BellRing className="h-3 w-3 mr-1.5" />
              {t("testPush", "Test notification")}
            </Button>
          </div>
        )}

        {/* Permission Blocked Warning */}
        {permission === "denied" && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
            {t("pushBlockedWarning", "Notifications are blocked. To enable them, click the lock icon in your browser's address bar and allow notifications for this site.")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
