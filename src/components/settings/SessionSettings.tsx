/**
 * Session Settings Component
 * 
 * Allows users to configure session timeout duration.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Clock, Loader2, Save } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const TIMEOUT_OPTIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
];

export function SessionSettings() {
  const { t } = useTranslation();
  const { profile, fetchProfile, updateProfile, isLoading } = useProfile();
  const [timeout, setTimeout] = useState<number>(15);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      setTimeout(profile.session_timeout_minutes);
    }
  }, [profile]);

  const handleTimeoutChange = (value: string) => {
    const newTimeout = parseInt(value, 10);
    setTimeout(newTimeout);
    setHasChanges(newTimeout !== profile?.session_timeout_minutes);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateProfile({ session_timeout_minutes: timeout });
    setIsSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("sessionSettingsSaved", "Session settings saved"));
      setHasChanges(false);
    }
  };

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t("sessionSettings", "Session Settings")}
        </CardTitle>
        <CardDescription>
          {t("sessionSettingsDescription", "Configure how long you stay logged in when inactive")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-timeout">{t("sessionTimeout", "Session Timeout")}</Label>
          <Select
            value={timeout.toString()}
            onValueChange={handleTimeoutChange}
            disabled={isLoading}
          >
            <SelectTrigger id="session-timeout" className="w-full">
              <SelectValue placeholder={t("selectTimeout", "Select timeout duration")} />
            </SelectTrigger>
            <SelectContent>
              {TIMEOUT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {t("sessionTimeoutHelp", "You'll be automatically logged out after this period of inactivity for security.")}
          </p>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="w-full">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {t("saveChanges", "Save Changes")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
