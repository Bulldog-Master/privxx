/**
 * Alert Settings Component
 * 
 * Allows users to enable/disable sound and vibration alerts for session warnings.
 */

import { useTranslation } from "react-i18next";
import { Volume2, Vibrate, VolumeX, SmartphoneNfc } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAlertPreferences } from "@/hooks/useAlertPreferences";
import { alertWarning } from "@/lib/alerts";
import { toast } from "@/hooks/use-toast";

export function AlertSettings() {
  const { t } = useTranslation("ui");
  const { 
    isSoundEnabled, 
    isVibrationEnabled, 
    toggleSound, 
    toggleVibration 
  } = useAlertPreferences();

  // Check if vibration is supported
  const vibrationSupported = "vibrate" in navigator;

  const handleSoundToggle = () => {
    toggleSound();
    toast({
      title: t("preferenceUpdated", "Preference updated"),
      description: !isSoundEnabled 
        ? t("soundEnabled", "Sound alerts enabled") 
        : t("soundDisabled", "Sound alerts disabled"),
    });
  };

  const handleVibrationToggle = () => {
    toggleVibration();
    toast({
      title: t("preferenceUpdated", "Preference updated"),
      description: !isVibrationEnabled 
        ? t("vibrationEnabled", "Vibration alerts enabled") 
        : t("vibrationDisabled", "Vibration alerts disabled"),
    });
  };

  const handleTestAlert = () => {
    alertWarning();
    toast({
      title: t("testAlert", "Test Alert"),
      description: t("testAlertDesc", "Alert triggered with current settings"),
    });
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          {t("alertSettings", "Alert Settings")}
        </CardTitle>
        <CardDescription>
          {t("alertSettingsDesc", "Control sound and vibration for session warnings")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sound Alerts */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            {isSoundEnabled ? (
              <Volume2 className="h-5 w-5 text-muted-foreground mt-0.5" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="space-y-0.5">
              <Label htmlFor="sound-alerts" className="text-sm font-medium">
                {t("soundAlerts", "Sound alerts")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("soundAlertsDesc", "Play audio tone for session expiry warnings")}
              </p>
            </div>
          </div>
          <Switch
            id="sound-alerts"
            checked={isSoundEnabled}
            onCheckedChange={handleSoundToggle}
          />
        </div>

        {/* Vibration Alerts */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-start gap-3">
            {isVibrationEnabled ? (
              <Vibrate className="h-5 w-5 text-muted-foreground mt-0.5" />
            ) : (
              <SmartphoneNfc className="h-5 w-5 text-muted-foreground mt-0.5" />
            )}
            <div className="space-y-0.5">
              <Label htmlFor="vibration-alerts" className="text-sm font-medium">
                {t("vibrationAlerts", "Vibration alerts")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {vibrationSupported 
                  ? t("vibrationAlertsDesc", "Vibrate device for session expiry warnings")
                  : t("vibrationNotSupported", "Vibration not supported on this device")}
              </p>
            </div>
          </div>
          <Switch
            id="vibration-alerts"
            checked={isVibrationEnabled}
            onCheckedChange={handleVibrationToggle}
            disabled={!vibrationSupported}
          />
        </div>

        {/* Test Button */}
        <div className="pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleTestAlert}
            className="w-full"
          >
            {t("testAlertButton", "Test Alert")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
