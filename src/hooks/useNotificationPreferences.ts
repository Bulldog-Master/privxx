/**
 * Hook for managing user notification preferences
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  session_warnings: boolean;
  security_alerts: boolean;
  connection_updates: boolean;
  new_device_login: boolean;
  digest_frequency: "immediate" | "daily" | "weekly";
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = useCallback(async () => {
    if (!user) {
      setPreferences(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        setPreferences(data as NotificationPreferences);
      } else {
        // Create default preferences if none exist
        const { data: newData, error: insertError } = await supabase
          .from("notification_preferences")
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newData as NotificationPreferences);
      }
    } catch (err) {
      console.error("Error fetching notification preferences:", err);
      setError(err instanceof Error ? err.message : "Failed to load preferences");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  const updatePreference = useCallback(
    async (key: keyof Pick<NotificationPreferences, "session_warnings" | "security_alerts" | "connection_updates" | "new_device_login" | "digest_frequency">, value: boolean | string) => {
      if (!user || !preferences) return;

      try {
        const { error: updateError } = await supabase
          .from("notification_preferences")
          .update({ [key]: value })
          .eq("user_id", user.id);

        if (updateError) throw updateError;

        setPreferences((prev) => (prev ? { ...prev, [key]: value } : null));
      } catch (err) {
        console.error("Error updating notification preference:", err);
        throw err;
      }
    },
    [user, preferences]
  );

  return {
    preferences,
    isLoading,
    error,
    updatePreference,
    refetch: fetchPreferences,
  };
}
