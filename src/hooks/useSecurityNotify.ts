/**
 * Hook to send security change notifications
 */

import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type SecurityEventType =
  | "password_changed"
  | "2fa_enabled"
  | "2fa_disabled"
  | "passkey_added"
  | "passkey_removed"
  | "recovery_codes_regenerated"
  | "email_changed"
  | "session_timeout_changed";

export function useSecurityNotify() {
  const notify = useCallback(async (
    eventType: SecurityEventType,
    metadata?: Record<string, unknown>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke("security-notify", {
        body: { event_type: eventType, metadata },
      });

      if (error) {
        console.error("Security notification failed:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Security notification error:", err);
      return false;
    }
  }, []);

  return { notify };
}
