/**
 * useInboxPoll Hook (Phase-1)
 * 
 * Polls /message/inbox for undelivered counts and conversation discovery.
 * Pauses when tab is backgrounded.
 * 
 * Phase-1 compatible: No protocol changes, frontend-only optimization.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useIdentity } from "@/features/identity";
import { bridgeClient } from "@/api/bridge";
import { useTabVisibility } from "./useTabVisibility";

const DEFAULT_POLL_INTERVAL_MS = 25000; // 20-30s range

export interface InboxPollOptions {
  /** Polling interval in ms (default: 25000) */
  intervalMs?: number;
  /** Max items to fetch (default: 100) */
  limit?: number;
  /** Callback when new conversation IDs are discovered */
  onDiscoveredIds?: (ids: string[]) => void;
}

interface UseInboxPollReturn {
  /** Undelivered count per conversation */
  undeliveredByConv: Record<string, number>;
  /** All discovered conversation IDs from inbox */
  discoveredConversationIds: Set<string>;
  /** Loading state for initial fetch */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Total undelivered across all conversations */
  totalUndelivered: number;
  /** Manually trigger inbox refresh */
  refreshInbox: () => Promise<void>;
}

export function useInboxPoll(options: InboxPollOptions = {}): UseInboxPollReturn {
  const { intervalMs = DEFAULT_POLL_INTERVAL_MS, limit = 100, onDiscoveredIds } = options;
  
  const { isInitialized } = useIdentity();
  const tabVisible = useTabVisibility();
  
  const [undeliveredByConv, setUndeliveredByConv] = useState<Record<string, number>>({});
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  const fetchInbox = useCallback(async () => {
    // Phase-1: poll even while locked (ciphertext-only, no decryption needed)
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    
    setError(null);
    if (Object.keys(undeliveredByConv).length === 0) {
      setIsLoading(true);
    }
    
    try {
      const response = await bridgeClient.fetchInbox({ limit });
      const items = response.items ?? [];
      
      // Group by conversationId
      const countsByConv: Record<string, number> = {};
      const newIds: string[] = [];
      
      items.forEach((item) => {
        countsByConv[item.conversationId] = (countsByConv[item.conversationId] ?? 0) + 1;
        
        // Track newly discovered IDs
        if (!discoveredIds.has(item.conversationId)) {
          newIds.push(item.conversationId);
        }
      });
      
      // Update discovered IDs
      if (newIds.length > 0) {
        setDiscoveredIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.add(id));
          return next;
        });
        
        // Notify callback
        if (onDiscoveredIds) {
          onDiscoveredIds(newIds);
        }
      }
      
      setUndeliveredByConv(countsByConv);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load inbox";
      setError(msg);
      console.error("[useInboxPoll] Fetch error:", e);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [limit, discoveredIds, onDiscoveredIds, undeliveredByConv]);

  // Polling lifecycle
  useEffect(() => {
    // Stop polling only when identity context not ready
    if (!isInitialized) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }
    
    // Pause polling when tab is backgrounded
    if (!tabVisible) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }
    
    // Initial fetch
    fetchInbox();
    
    // Set up polling
    pollTimerRef.current = window.setInterval(fetchInbox, intervalMs);
    
    // Focus-based refresh
    const handleFocus = () => {
      fetchInbox();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      window.removeEventListener("focus", handleFocus);
    };
  }, [isInitialized, tabVisible, intervalMs, fetchInbox]);

  // Calculate total undelivered
  const totalUndelivered = Object.values(undeliveredByConv).reduce((sum, c) => sum + c, 0);

  return {
    undeliveredByConv,
    discoveredConversationIds: discoveredIds,
    isLoading,
    error,
    totalUndelivered,
    refreshInbox: fetchInbox,
  };
}
