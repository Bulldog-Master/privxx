/**
 * Hook for managing alert preferences (sound/vibration)
 * 
 * Stores preferences in localStorage since these are device-specific.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "privxx_alert_preferences";

export interface AlertPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const DEFAULT_PREFERENCES: AlertPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
};

export function useAlertPreferences() {
  const [preferences, setPreferences] = useState<AlertPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AlertPreferences>;
        setPreferences({
          ...DEFAULT_PREFERENCES,
          ...parsed,
        });
      }
    } catch (e) {
      console.debug("[AlertPreferences] Failed to load:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPrefs: AlertPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
      setPreferences(newPrefs);
    } catch (e) {
      console.debug("[AlertPreferences] Failed to save:", e);
    }
  }, []);

  const updatePreference = useCallback(
    <K extends keyof AlertPreferences>(key: K, value: AlertPreferences[K]) => {
      const newPrefs = { ...preferences, [key]: value };
      savePreferences(newPrefs);
    },
    [preferences, savePreferences]
  );

  const toggleSound = useCallback(() => {
    updatePreference("soundEnabled", !preferences.soundEnabled);
  }, [preferences.soundEnabled, updatePreference]);

  const toggleVibration = useCallback(() => {
    updatePreference("vibrationEnabled", !preferences.vibrationEnabled);
  }, [preferences.vibrationEnabled, updatePreference]);

  return {
    preferences,
    isLoading,
    updatePreference,
    toggleSound,
    toggleVibration,
    isSoundEnabled: preferences.soundEnabled,
    isVibrationEnabled: preferences.vibrationEnabled,
  };
}

// Singleton getter for use outside React components (e.g., in alerts.ts)
export function getAlertPreferences(): AlertPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<AlertPreferences>;
      return { ...DEFAULT_PREFERENCES, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return DEFAULT_PREFERENCES;
}
