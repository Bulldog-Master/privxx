/**
 * Notification Sound Settings Component
 * 
 * Allows users to configure custom notification sounds per event type.
 * Respects Do Not Disturb schedule.
 */

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Volume2, VolumeX, Play, Moon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/useToast";
import { isDNDActive } from "./DoNotDisturbSettings";

type SoundType = 'none' | 'subtle' | 'chime' | 'alert' | 'urgent';
type EventType = 'password_changed' | '2fa_enabled' | 'new_device_login' | 'passkey_added';

interface EventSoundPreference {
  soundType: SoundType;
  enabled: boolean;
}

interface NotificationSoundPreferences {
  globalVolume: number;
  globalEnabled: boolean;
  eventSounds: Record<EventType, EventSoundPreference>;
}

const STORAGE_KEY = 'privxx_notification_sounds';

const DEFAULT_PREFERENCES: NotificationSoundPreferences = {
  globalVolume: 50,
  globalEnabled: true,
  eventSounds: {
    password_changed: { soundType: 'alert', enabled: true },
    '2fa_enabled': { soundType: 'chime', enabled: true },
    new_device_login: { soundType: 'urgent', enabled: true },
    passkey_added: { soundType: 'chime', enabled: true },
  },
};

const SOUND_OPTIONS: { value: SoundType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'chime', label: 'Chime' },
  { value: 'alert', label: 'Alert' },
  { value: 'urgent', label: 'Urgent' },
];

const EVENT_LABELS: Record<EventType, { label: string; description: string }> = {
  password_changed: { label: 'Password changed', description: 'When password is updated' },
  '2fa_enabled': { label: '2FA changes', description: 'When 2FA is enabled/disabled' },
  new_device_login: { label: 'New device login', description: 'Sign-in from new device' },
  passkey_added: { label: 'Passkey changes', description: 'When passkeys are added/removed' },
};

// Web Audio API sound generation
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
) {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

const SOUND_CONFIGS: Record<SoundType, (ctx: AudioContext, volume: number) => void> = {
  none: () => {},
  
  subtle: (ctx, volume) => {
    playTone(ctx, 880, 0.15, volume, 'sine');
  },
  
  chime: (ctx, volume) => {
    playTone(ctx, 523, 0.2, volume, 'sine');
    setTimeout(() => playTone(ctx, 659, 0.25, volume * 0.8, 'sine'), 150);
  },
  
  alert: (ctx, volume) => {
    playTone(ctx, 800, 0.1, volume, 'square');
    setTimeout(() => playTone(ctx, 800, 0.1, volume, 'square'), 150);
  },
  
  urgent: (ctx, volume) => {
    playTone(ctx, 1000, 0.08, volume, 'sawtooth');
    setTimeout(() => playTone(ctx, 1200, 0.08, volume, 'sawtooth'), 100);
    setTimeout(() => playTone(ctx, 1000, 0.08, volume, 'sawtooth'), 200);
    setTimeout(() => playTone(ctx, 1200, 0.08, volume, 'sawtooth'), 300);
  },
};

export function NotificationSoundSettings() {
  const { t } = useTranslation("ui");
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationSoundPreferences>(DEFAULT_PREFERENCES);
  const [dndActive, setDndActive] = useState(false);

  // Check DND status periodically
  useEffect(() => {
    const checkDND = () => setDndActive(isDNDActive());
    checkDND();
    const interval = setInterval(checkDND, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      // Ignore errors
    }
    setIsLoading(false);
  }, []);

  const savePreferences = (newPrefs: NotificationSoundPreferences) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
    } catch {
      // Ignore errors
    }
  };

  const handleGlobalToggle = (enabled: boolean) => {
    savePreferences({ ...preferences, globalEnabled: enabled });
    toast({
      title: enabled ? t("soundsEnabled", "Sounds enabled") : t("soundsDisabled", "Sounds disabled"),
      description: enabled 
        ? t("soundsEnabledDesc", "You'll hear audio alerts for security events.")
        : t("soundsDisabledDesc", "Audio alerts are now muted."),
    });
  };

  const handleVolumeChange = (value: number[]) => {
    savePreferences({ ...preferences, globalVolume: value[0] });
  };

  const handleEventSoundChange = (event: EventType, soundType: SoundType) => {
    const newEventSounds = {
      ...preferences.eventSounds,
      [event]: { ...preferences.eventSounds[event], soundType },
    };
    savePreferences({ ...preferences, eventSounds: newEventSounds });
  };

  const handleEventToggle = (event: EventType, enabled: boolean) => {
    const newEventSounds = {
      ...preferences.eventSounds,
      [event]: { ...preferences.eventSounds[event], enabled },
    };
    savePreferences({ ...preferences, eventSounds: newEventSounds });
  };

  const playPreviewSound = (soundType: SoundType) => {
    if (soundType === 'none') return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const volume = (preferences.globalVolume / 100) * 0.3;
    SOUND_CONFIGS[soundType](ctx, volume);
  };

  if (isLoading) {
    return (
      <Card className="bg-card/90 backdrop-blur-sm border-border/50">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
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
              <Volume2 className="h-5 w-5" />
              {t("notificationSounds", "Notification Sounds")}
            </CardTitle>
            <CardDescription className="text-primary/70">
              {t("notificationSoundsDesc", "Customize audio alerts for security events")}
            </CardDescription>
          </div>
          {dndActive && preferences.globalEnabled && (
            <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
              <Moon className="h-3 w-3 mr-1" />
              {t("muted", "Muted")}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Global Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {preferences.globalEnabled ? (
              <Volume2 className="h-5 w-5 text-primary/70" />
            ) : (
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label className="text-sm font-medium text-primary">
                {t("enableSounds", "Enable notification sounds")}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t("enableSoundsDesc", "Play audio when security events occur")}
              </p>
            </div>
          </div>
          <Switch
            checked={preferences.globalEnabled}
            onCheckedChange={handleGlobalToggle}
          />
        </div>

        {/* Volume Slider */}
        {preferences.globalEnabled && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-primary/80">
                {t("volume", "Volume")}
              </Label>
              <span className="text-xs text-muted-foreground">{preferences.globalVolume}%</span>
            </div>
            <Slider
              value={[preferences.globalVolume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Per-Event Sound Settings */}
        {preferences.globalEnabled && (
          <div className="space-y-3 pt-2 border-t border-border/30">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("eventSounds", "Event Sounds")}
            </Label>
            
            {(Object.keys(EVENT_LABELS) as EventType[]).map((event) => {
              const eventPref = preferences.eventSounds[event];
              const eventInfo = EVENT_LABELS[event];
              
              return (
                <div
                  key={event}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    eventPref.enabled
                      ? "bg-background/50 border-border/30"
                      : "bg-muted/20 border-border/20 opacity-60"
                  }`}
                >
                  <Switch
                    checked={eventPref.enabled}
                    onCheckedChange={(checked) => handleEventToggle(event, checked)}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {t(`events.${event}`, eventInfo.label)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t(`events.${event}Desc`, eventInfo.description)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select
                      value={eventPref.soundType}
                      onValueChange={(value) => handleEventSoundChange(event, value as SoundType)}
                      disabled={!eventPref.enabled}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOUND_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className="text-xs">
                            {t(`sounds.${option.value}`, option.label)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => playPreviewSound(eventPref.soundType)}
                      disabled={!eventPref.enabled || eventPref.soundType === 'none'}
                    >
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
