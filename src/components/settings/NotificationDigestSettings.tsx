/**
 * Notification Digest Settings Component
 * 
 * Allows users to configure email notification frequency.
 */

import { useTranslation } from "react-i18next";
import { Mail, Clock, CalendarDays, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { toast } from "@/hooks/useToast";

type DigestFrequency = "immediate" | "daily" | "weekly";

const frequencyOptions: { value: DigestFrequency; icon: typeof Zap; label: string; description: string }[] = [
  {
    value: "immediate",
    icon: Zap,
    label: "Immediate",
    description: "Receive emails as events happen",
  },
  {
    value: "daily",
    icon: Clock,
    label: "Daily digest",
    description: "One email per day summarizing events",
  },
  {
    value: "weekly",
    icon: CalendarDays,
    label: "Weekly digest",
    description: "One email per week summarizing events",
  },
];

export function NotificationDigestSettings() {
  const { t } = useTranslation("ui");
  const { preferences, isLoading, updatePreference } = useNotificationPreferences();

  const handleFrequencyChange = async (value: string) => {
    try {
      await updatePreference("digest_frequency", value as DigestFrequency);
      toast({
        title: t("preferenceUpdated", "Preference updated"),
        description: t("digestFrequencyUpdated", "Your notification frequency has been updated."),
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
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const currentFrequency = (preferences?.digest_frequency as DigestFrequency) || "immediate";

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Mail className="h-5 w-5" />
          {t("emailDigest", "Email Digest")}
        </CardTitle>
        <CardDescription className="text-primary/70">
          {t("emailDigestDesc", "Choose how often to receive security email notifications")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={currentFrequency}
          onValueChange={handleFrequencyChange}
          className="space-y-3"
        >
          {frequencyOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = currentFrequency === option.value;
            
            return (
              <div
                key={option.value}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-border/30 bg-background/50 hover:border-border/50"
                }`}
                onClick={() => handleFrequencyChange(option.value)}
              >
                <RadioGroupItem
                  value={option.value}
                  id={`digest-${option.value}`}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                    <Label
                      htmlFor={`digest-${option.value}`}
                      className={`text-sm font-medium cursor-pointer ${
                        isSelected ? "text-primary" : "text-primary/80"
                      }`}
                    >
                      {t(`digest.${option.value}`, option.label)}
                    </Label>
                    {option.value !== "immediate" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground border-muted-foreground/30">
                        {t("comingSoon", "Coming soon")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                    {t(`digest.${option.value}Desc`, option.description)}
                  </p>
                </div>
              </div>
            );
          })}
        </RadioGroup>
        
        {currentFrequency !== "immediate" && (
          <p className="text-xs text-muted-foreground mt-4 p-2 rounded bg-muted/30">
            {t("digestNote", "Note: Digest mode is currently in preview. Critical security alerts will still be sent immediately.")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
