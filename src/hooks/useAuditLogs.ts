/**
 * Audit Logs Hook
 * 
 * Fetches the authenticated user's security audit logs via the privacy-safe view.
 * IP addresses and user agents are excluded to comply with privacy requirements.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuditLog {
  id: string;
  event_type: string;
  success: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseAuditLogsOptions {
  limit?: number;
  autoFetch?: boolean;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}) {
  const { limit = 50, autoFetch = true } = options;
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Use privacy-safe view that excludes IP addresses and user agents
      const { data, error: fetchError } = await (supabase
        .from('audit_logs_safe' as any)
        .select('id, event_type, success, metadata, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit)) as { data: AuditLog[] | null; error: any };

      if (fetchError) {
        console.error('[useAuditLogs] Fetch error:', fetchError);
        setError('Failed to load audit logs');
        return;
      }

      setLogs(data || []);
    } catch (err) {
      console.error('[useAuditLogs] Error:', err);
      setError('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchLogs();
    }
  }, [autoFetch, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    refetch: fetchLogs,
  };
}
