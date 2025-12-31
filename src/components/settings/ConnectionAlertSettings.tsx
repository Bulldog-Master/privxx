/**
 * Connection Alert Settings Component
 * 
 * Allows users to configure performance alert thresholds.
 */

import { useTranslation } from "react-i18next";
import { Activity, RotateCcw, Gauge, Bell, BellOff, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useConnectionAlertPreferences } from "@/hooks/useConnectionAlertPreferences";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { toast } from "@/hooks/useToast";

export function ConnectionAlertSettings() {
  const { t } = useTranslation("ui");
  const { 
    thresholds, 
    updateThreshold, 
    resetThresholds,
    defaults,
  } = useConnectionAlertPreferences();
  
  const {
    isSupported: pushSupported,
    permission: pushPermission,
    isEnabled: pushEnabled,
    lastDelivered,
    requestPermission,
    setEnabled: setPushEnabled,
    showNotification,
  } = usePushNotifications();

  const handleToggleAlerts = () => {
    updateThreshold('alertsEnabled', !thresholds.alertsEnabled);
    toast({
      title: t("preferenceUpdated", "Preference updated"),
      description: !thresholds.alertsEnabled 
        ? t("connectionAlerts.enabled", "Connection quality alerts enabled") 
        : t("connectionAlerts.disabled", "Connection quality alerts disabled"),
    });
  };

  const handleTogglePush = async () => {
    if (!thresholds.pushEnabled) {
      // Enabling push - request permission if needed
      if (pushPermission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          toast({
            title: t("connectionAlerts.pushDenied", "Permission denied"),
            description: t("connectionAlerts.pushDeniedDesc", "Enable notifications in browser settings"),
            variant: "destructive",
          });
          return;
        }
      }
      updateThreshold('pushEnabled', true);
      setPushEnabled(true);
      toast({
        title: t("preferenceUpdated", "Preference updated"),
        description: t("connectionAlerts.pushEnabled", "Push notifications enabled"),
      });
    } else {
      updateThreshold('pushEnabled', false);
      setPushEnabled(false);
      toast({
        title: t("preferenceUpdated", "Preference updated"),
        description: t("connectionAlerts.pushDisabled", "Push notifications disabled"),
      });
    }
  };

  const handleReset = () => {
    resetThresholds();
    toast({
      title: t("connectionAlerts.reset", "Thresholds reset"),
      description: t("connectionAlerts.resetDesc", "Alert thresholds restored to defaults"),
    });
  };

  const isModified = 
    thresholds.latencyWarning !== defaults.latencyWarning ||
    thresholds.latencyCritical !== defaults.latencyCritical ||
    thresholds.degradedDuration !== defaults.degradedDuration;

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5" />
          {t("connectionAlerts.title", "Connection Quality Alerts")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("connectionAlerts.description", "Configure when to receive performance notifications")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            <Gauge className="h-5 w-5 text-primary/70 mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="connection-alerts" className="text-sm font-medium text-primary">
                {t("connectionAlerts.enableLabel", "Connection quality alerts")}
              </Label>
              <p className="text-xs text-primary/70">
                {t("connectionAlerts.enableDesc", "Show notifications when connection quality degrades")}
              </p>
            </div>
          </div>
          <Switch
            id="connection-alerts"
            checked={thresholds.alertsEnabled}
            onCheckedChange={handleToggleAlerts}
          />
        </div>

        {thresholds.alertsEnabled && (
          <>
            {/* Push Notifications Toggle */}
            {pushSupported && (
              <div className="flex items-center justify-between py-2 border-t border-border/30">
                <div className="flex items-start gap-3">
                  {thresholds.pushEnabled ? (
                    <Bell className="h-5 w-5 text-primary/70 mt-0.5" />
                  ) : (
                    <BellOff className="h-5 w-5 text-primary/70 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <Label htmlFor="push-alerts" className="text-sm font-medium text-primary">
                      {t("connectionAlerts.pushLabel", "Background notifications")}
                    </Label>
                    <p className="text-xs text-primary/70">
                      {t("connectionAlerts.pushDesc", "Receive alerts even when app is in background")}
                    </p>
                    {pushPermission === 'denied' && (
                      <p className="text-xs text-destructive">
                        {t("connectionAlerts.pushBlocked", "Notifications blocked in browser settings")}
                      </p>
                    )}
                    {lastDelivered && thresholds.pushEnabled && pushEnabled && (
                      <p className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {t("connectionAlerts.lastDelivered", "Last delivered")} {formatDistanceToNow(new Date(lastDelivered), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {thresholds.pushEnabled && pushEnabled && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        showNotification(
                          t("connectionAlerts.testTitle", "Test Notification"),
                          { body: t("connectionAlerts.testBody", "Push notifications are working correctly!") }
                        );
                        toast({
                          title: t("connectionAlerts.testSent", "Test sent"),
                          description: t("connectionAlerts.testSentDesc", "Check your notifications"),
                        });
                      }}
                      className="text-xs h-7 px-2"
                    >
                      {t("connectionAlerts.test", "Test")}
                    </Button>
                  )}
                  <Switch
                    id="push-alerts"
                    checked={thresholds.pushEnabled && pushEnabled}
                    onCheckedChange={handleTogglePush}
                    disabled={pushPermission === 'denied'}
                  />
                </div>
              </div>
            )}

            {/* Latency Warning Threshold */}
            <div className="space-y-3 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-primary">
                  {t("connectionAlerts.latencyWarning", "Latency warning threshold")}
                </Label>
                <span className="text-sm font-mono text-primary/70">
                  {thresholds.latencyWarning}ms
                </span>
              </div>
              <Slider
                value={[thresholds.latencyWarning]}
                onValueChange={([value]) => updateThreshold('latencyWarning', value)}
                min={200}
                max={2000}
                step={50}
                className="w-full"
              />
              <p className="text-xs text-primary/50">
                {t("connectionAlerts.latencyWarningDesc", "Show warning when latency exceeds this value")}
              </p>
            </div>

            {/* Latency Critical Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-primary">
                  {t("connectionAlerts.latencyCritical", "Latency critical threshold")}
                </Label>
                <span className="text-sm font-mono text-primary/70">
                  {thresholds.latencyCritical}ms
                </span>
              </div>
              <Slider
                value={[thresholds.latencyCritical]}
                onValueChange={([value]) => updateThreshold('latencyCritical', value)}
                min={500}
                max={5000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-primary/50">
                {t("connectionAlerts.latencyCriticalDesc", "Show critical alert when latency exceeds this value")}
              </p>
            </div>

            {/* Degraded Duration Threshold */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-primary">
                  {t("connectionAlerts.degradedDuration", "Degraded state alert delay")}
                </Label>
                <span className="text-sm font-mono text-primary/70">
                  {thresholds.degradedDuration / 1000}s
                </span>
              </div>
              <Slider
                value={[thresholds.degradedDuration]}
                onValueChange={([value]) => updateThreshold('degradedDuration', value)}
                min={5000}
                max={60000}
                step={5000}
                className="w-full"
              />
              <p className="text-xs text-primary/50">
                {t("connectionAlerts.degradedDurationDesc", "Wait this long before alerting about degraded connection")}
              </p>
            </div>

            {/* Reset Button */}
            {isModified && (
              <div className="pt-2 border-t border-border/30">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleReset}
                  className="w-full gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("connectionAlerts.resetButton", "Reset to Defaults")}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
