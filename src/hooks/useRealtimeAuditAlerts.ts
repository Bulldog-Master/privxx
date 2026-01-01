/**
 * Real-time Audit Alerts Hook
 * 
 * Listens for suspicious audit events in real-time and triggers alerts.
 * Integrates with the notification preferences and alert system.
 */

import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationPreferences } from "./useNotificationPreferences";
import { alertWarning, alertUrgent } from "@/lib/alerts";
import { useToast } from "@/components/ui/use-toast";
import type { RealtimePostgresInsertPayload } from "@supabase/supabase-js";

// Event types considered suspicious
const SUSPICIOUS_EVENTS = [
  "auth_signin_failure",
  "auth_signup_failure",
  "passkey_auth_failure",
  "totp_verify_failure",
] as const;

// Event types that are urgent (require immediate attention)
const URGENT_EVENTS = [
  "totp_backup_code_used",
  "auth_password_reset_request",
  "auth_password_reset_complete",
] as const;

interface AuditLogPayload {
  id: string;
  user_id: string | null;
  event_type: string;
  success: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Event type display labels
const eventTypeLabels: Record<string, string> = {
  auth_signin_failure: "Failed sign-in attempt",
  auth_signup_failure: "Failed sign-up attempt",
  passkey_auth_failure: "Failed passkey authentication",
  totp_verify_failure: "Failed 2FA verification",
  totp_backup_code_used: "Backup code was used",
  auth_password_reset_request: "Password reset requested",
  auth_password_reset_complete: "Password was reset",
};

export interface UseRealtimeAuditAlertsOptions {
  enabled?: boolean;
}

export function useRealtimeAuditAlerts(options: UseRealtimeAuditAlertsOptions = {}) {
  const { enabled = true } = options;
  const { user } = useAuth();
  const { preferences } = useNotificationPreferences();
  const { toast } = useToast();

  // Track recent failures for pattern detection
  const recentFailures = useRef<{ timestamp: number; eventType: string }[]>([]);

  // Clean up old failures (older than 5 minutes)
  const cleanupOldFailures = useCallback(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    recentFailures.current = recentFailures.current.filter((f) => f.timestamp > fiveMinutesAgo);
  }, []);

  // Check for suspicious patterns (multiple failures in short time)
  const checkForPatterns = useCallback(
    (eventType: string): boolean => {
      cleanupOldFailures();

      // Add current failure
      recentFailures.current.push({
        timestamp: Date.now(),
        eventType,
      });

      // Check if there are 3+ failures in the last 5 minutes
      return recentFailures.current.length >= 3;
    },
    [cleanupOldFailures]
  );

  // Handle incoming audit event
  const handleAuditEvent = useCallback(
    (payload: RealtimePostgresInsertPayload<AuditLogPayload>) => {
      const event = payload.new;

      // Only process events for the current user
      if (event.user_id !== user?.id) return;

      // Check if security alerts are enabled
      if (!preferences?.security_alerts) return;

      const eventType = event.event_type;
      const isSuspicious = SUSPICIOUS_EVENTS.includes(eventType as (typeof SUSPICIOUS_EVENTS)[number]);
      const isUrgent = URGENT_EVENTS.includes(eventType as (typeof URGENT_EVENTS)[number]);

      // Handle urgent events
      if (isUrgent) {
        alertUrgent();
        toast({
          variant: "destructive",
          title: "Security Alert",
          description: eventTypeLabels[eventType] || eventType,
        });
        return;
      }

      // Handle suspicious events
      if (isSuspicious && !event.success) {
        const isPattern = checkForPatterns(eventType);

        if (isPattern) {
          // Multiple failures detected - urgent alert
          alertUrgent();
          toast({
            variant: "destructive",
            title: "Multiple Failed Attempts Detected",
            description: "Several failed authentication attempts have been detected on your account.",
          });
        } else {
          // Single failure - warning alert
          alertWarning();
          toast({
            variant: "default",
            title: "Security Notice",
            description: eventTypeLabels[eventType] || eventType,
          });
        }
      }
    },
    [user?.id, preferences?.security_alerts, toast, checkForPatterns]
  );

  useEffect(() => {
    if (!enabled || !user) return;

    // Subscribe to privacy-safe audit events (no IP/User-Agent)
    const channel = supabase
      .channel("audit-alerts")
      .on<AuditLogPayload>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_events_safe",
          filter: `user_id=eq.${user.id}`,
        },
        handleAuditEvent
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.debug("[RealtimeAuditAlerts] Subscribed to audit events");
        }
      });

    return () => {
      console.debug("[RealtimeAuditAlerts] Unsubscribing from audit events");
      supabase.removeChannel(channel);
    };
  }, [enabled, user, handleAuditEvent]);

  return {
    isEnabled: enabled && !!user && preferences?.security_alerts,
  };
}
