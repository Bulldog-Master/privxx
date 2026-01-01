/**
 * Do Not Disturb Settings Component
 * 
 * Allows users to schedule quiet hours when notification sounds are muted.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Clock, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/useToast";

interface DNDSchedule {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number;   // 0-23
  days: number[];    // 0-6 (Sun-Sat)
}

const STORAGE_KEY = 'privxx_dnd_schedule';

const DEFAULT_SCHEDULE: DNDSchedule = {
  enabled: false,
  startHour: 22, // 10 PM
  endHour: 7,    // 7 AM
  days: [0, 1, 2, 3, 4, 5, 6], // All days
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

function isInDNDPeriod(schedule: DNDSchedule): boolean {
  if (!schedule.enabled) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  // Check if current day is in the schedule
  if (!schedule.days.includes(currentDay)) return false;
  
  // Handle overnight schedules (e.g., 10 PM to 7 AM)
  if (schedule.startHour > schedule.endHour) {
    return currentHour >= schedule.startHour || currentHour < schedule.endHour;
  }
  
  // Same-day schedule (e.g., 1 PM to 5 PM)
  return currentHour >= schedule.startHour && currentHour < schedule.endHour;
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DoNotDisturbSettings() {
  const { t } = useTranslation("ui");
  const [isLoading, setIsLoading] = useState(true);
  const [schedule, setSchedule] = useState<DNDSchedule>(DEFAULT_SCHEDULE);
  const [isCurrentlyActive, setIsCurrentlyActive] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSchedule({ ...DEFAULT_SCHEDULE, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore errors
    }
    setIsLoading(false);
  }, []);

  // Check if DND is currently active
  useEffect(() => {
    const checkActive = () => {
      setIsCurrentlyActive(isInDNDPeriod(schedule));
    };
    
    checkActive();
    const interval = setInterval(checkActive, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedule]);

  const saveSchedule = (newSchedule: DNDSchedule) => {
    setSchedule(newSchedule);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSchedule));
    } catch {
      // Ignore errors
    }
  };

  const handleToggle = (enabled: boolean) => {
    saveSchedule({ ...schedule, enabled });
    toast({
      title: enabled 
        ? t("dndEnabled", "Do Not Disturb enabled") 
        : t("dndDisabled", "Do Not Disturb disabled"),
      description: enabled
        ? t("dndEnabledDesc", "Sounds will be muted during scheduled hours.")
        : t("dndDisabledDesc", "All notification sounds are now active."),
    });
  };

  const handleStartHourChange = (value: string) => {
    saveSchedule({ ...schedule, startHour: parseInt(value, 10) });
  };

  const handleEndHourChange = (value: string) => {
    saveSchedule({ ...schedule, endHour: parseInt(value, 10) });
  };

  const toggleDay = (day: number) => {
    const newDays = schedule.days.includes(day)
      ? schedule.days.filter(d => d !== day)
      : [...schedule.days, day].sort();
    saveSchedule({ ...schedule, days: newDays });
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

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-primary">
              <Moon className="h-5 w-5" />
              {t("doNotDisturb", "Do Not Disturb")}
            </CardTitle>
            <CardDescription className="text-primary/70">
              {t("doNotDisturbDesc", "Mute notification sounds during scheduled hours")}
            </CardDescription>
          </div>
          {schedule.enabled && isCurrentlyActive && (
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
              <Moon className="h-3 w-3 mr-1" />
              {t("active", "Active")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Moon className={`h-5 w-5 ${schedule.enabled ? "text-purple-500" : "text-muted-foreground"}`} />
            <div>
              <Label className="text-sm font-medium text-primary">
                {t("enableDND", "Enable quiet hours")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("enableDNDDesc", "Automatically mute sounds during set times")}
              </p>
            </div>
          </div>
          <Switch
            checked={schedule.enabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {schedule.enabled && (
          <>
            {/* Time Range */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("quietHours", "Quiet Hours")}
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t("from", "From")}
                  </Label>
                  <Select value={schedule.startHour.toString()} onValueChange={handleStartHourChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {formatHour(hour)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground mt-5" />
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground mb-1 block">
                    {t("to", "To")}
                  </Label>
                  <Select value={schedule.endHour.toString()} onValueChange={handleEndHourChange}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((hour) => (
                        <SelectItem key={hour} value={hour.toString()}>
                          {formatHour(hour)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Days */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("activeDays", "Active Days")}
              </Label>
              <div className="flex flex-wrap gap-2">
                {DAY_LABELS.map((label, index) => {
                  const isSelected = schedule.days.includes(index);
                  return (
                    <button
                      key={index}
                      onClick={() => toggleDay(index)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        isSelected
                          ? "bg-purple-500/20 border-purple-500/40 text-purple-600"
                          : "bg-muted/30 border-border/30 text-muted-foreground hover:border-border/50"
                      }`}
                    >
                      {t(`days.${label.toLowerCase()}`, label)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Summary */}
            <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                {schedule.startHour > schedule.endHour ? (
                  <Moon className="h-4 w-4 mt-0.5 text-purple-500" />
                ) : (
                  <Sun className="h-4 w-4 mt-0.5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-primary/80">
                    {schedule.startHour > schedule.endHour
                      ? t("overnightSchedule", "Overnight schedule")
                      : t("daytimeSchedule", "Daytime schedule")}
                  </p>
                  <p>
                    {t("scheduleSummary", "Sounds muted from {{start}} to {{end}}", {
                      start: formatHour(schedule.startHour),
                      end: formatHour(schedule.endHour),
                    })}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Export helper for checking DND status
export function isDNDActive(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    const schedule: DNDSchedule = { ...DEFAULT_SCHEDULE, ...JSON.parse(stored) };
    return isInDNDPeriod(schedule);
  } catch {
    return false;
  }
}
