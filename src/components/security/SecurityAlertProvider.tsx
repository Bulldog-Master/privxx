/**
 * Security Alert Provider
 * 
 * Wraps the app to provide real-time security alerts.
 * Automatically listens for suspicious audit events and notifies the user.
 */

import { useRealtimeAuditAlerts } from "@/hooks/useRealtimeAuditAlerts";

interface SecurityAlertProviderProps {
  children: React.ReactNode;
}

export function SecurityAlertProvider({ children }: SecurityAlertProviderProps) {
  // Initialize real-time audit alerts
  useRealtimeAuditAlerts({ enabled: true });
  
  return <>{children}</>;
}
