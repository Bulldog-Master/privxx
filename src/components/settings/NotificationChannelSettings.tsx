/**
 * Multi-Channel Notification Settings Component
 * 
 * Allows users to configure notification channels (email, push) for each event type.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings2, Mail, BellRing, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences, NotificationChannels } from "@/hooks/useNotificationPreferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/useToast";

type NotificationChannel = "email" | "push";
type EventType = 
  | "password_changed"
  | "2fa_enabled"
  | "2fa_disabled"
  | "passkey_added"
  | "passkey_removed"
  | "new_device_login";

const eventTypes: { id: EventType; label: string; description: string }[] = [
  { id: "password_changed", label: "Password changed", description: "When your password is updated" },
  { id: "2fa_enabled", label: "2FA enabled", description: "When two-factor auth is turned on" },
  { id: "2fa_disabled", label: "2FA disabled", description: "When two-factor auth is turned off" },
  { id: "passkey_added", label: "Passkey added", description: "When a new passkey is registered" },
  { id: "passkey_removed", label: "Passkey removed", description: "When a passkey is deleted" },
  { id: "new_device_login", label: "New device login", description: "When signing in from a new device" },
];

export function NotificationChannelSettings() {
  const { t } = useTranslation("ui");
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();
  const { isSupported: pushSupported, permission: pushPermission } = usePushNotifications();
  const [channels, setChannels] = useState<NotificationChannels>({});

  useEffect(() => {
    if (preferences?.notification_channels) {
      setChannels(preferences.notification_channels as NotificationChannels);
    }
  }, [preferences?.notification_channels]);

  const handleChannelToggle = async (eventType: EventType, channel: NotificationChannel, enabled: boolean) => {
    const currentChannels = channels[eventType] || [];
    let newChannels: NotificationChannel[];
    
    if (enabled) {
      newChannels = [...currentChannels, channel];
    } else {
      newChannels = currentChannels.filter(c => c !== channel);
    }

    const updatedChannels = {
      ...channels,
      [eventType]: newChannels,
    };

    setChannels(updatedChannels);

    try {
      await updatePreference("notification_channels", updatedChannels);
      toast({
        title: t("preferenceUpdated", "Preference updated"),
        description: t("channelUpdated", "Notification channel updated."),
      });
    } catch {
      // Revert on error
      setChannels(channels);
      toast({
        title: t("error", "Error"),
        description: t("failedToUpdatePreference", "Failed to update preference. Please try again."),
        variant: "destructive",
      });
    }
  };

  const isChannelEnabled = (eventType: EventType, channel: NotificationChannel): boolean => {
    return (channels[eventType] || []).includes(channel);
  };

  const pushDisabled = !pushSupported || pushPermission !== "granted";

  if (isLoading) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Settings2 className="h-5 w-5" />
          {t("notificationChannels", "Notification Channels")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("notificationChannelsDesc", "Choose how to be notified for each security event")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Header row */}
        <div className="grid grid-cols-[1fr,60px,60px] gap-2 mb-3 pb-2 border-b border-border/30">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {t("event", "Event")}
          </div>
          <div className="flex justify-center">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              <Mail className="h-3 w-3 mr-1" />
              {t("email", "Email")}
            </Badge>
          </div>
          <div className="flex justify-center">
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${pushDisabled ? "opacity-50" : ""}`}>
              <BellRing className="h-3 w-3 mr-1" />
              {t("push", "Push")}
            </Badge>
          </div>
        </div>

        {/* Event rows */}
        <div className="space-y-1">
          {eventTypes.map((event) => (
            <div
              key={event.id}
              className="grid grid-cols-[1fr,60px,60px] gap-2 py-2 hover:bg-muted/30 rounded-md transition-colors"
            >
              <div className="min-w-0">
                <Label className="text-sm font-medium text-primary block truncate">
                  {t(`events.${event.id}`, event.label)}
                </Label>
                <p className="text-xs text-muted-foreground truncate">
                  {t(`events.${event.id}Desc`, event.description)}
                </p>
              </div>
              <div className="flex justify-center items-center">
                <Checkbox
                  checked={isChannelEnabled(event.id, "email")}
                  onCheckedChange={(checked) => handleChannelToggle(event.id, "email", !!checked)}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
              <div className="flex justify-center items-center">
                <Checkbox
                  checked={isChannelEnabled(event.id, "push")}
                  onCheckedChange={(checked) => handleChannelToggle(event.id, "push", !!checked)}
                  disabled={pushDisabled}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
            </div>
          ))}
        </div>

        {pushDisabled && (
          <p className="text-xs text-muted-foreground mt-4 p-2 rounded bg-muted/30">
            {t("pushDisabledHint", "Enable push notifications above to use the Push channel.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
