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
import { useAuth } from "@/contexts/AuthContext";
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
  const { isAuthenticated } = useAuth();
  const tabVisible = useTabVisibility();
  
  const [undeliveredByConv, setUndeliveredByConv] = useState<Record<string, number>>({});
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  
  // Stable refs to avoid interval churn from closing over changing state
  const onDiscoveredIdsRef = useRef(onDiscoveredIds);
  onDiscoveredIdsRef.current = onDiscoveredIds;

  const fetchInbox = useCallback(async () => {
    // Phase-1: poll even while locked (ciphertext-only, no decryption needed)
    // But require auth to prevent 401 spam
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    
    setError(null);
    setIsLoading((prev) => prev || true); // Only set true on first load
    
    try {
      const response = await bridgeClient.fetchInbox({ limit });
      const items = response.items ?? [];
      
      // Group by conversationId using functional setState to avoid stale closures
      const countsByConv: Record<string, number> = {};
      const allConvIds: string[] = [];
      
      items.forEach((item) => {
        countsByConv[item.conversationId] = (countsByConv[item.conversationId] ?? 0) + 1;
        allConvIds.push(item.conversationId);
      });
      
      // Update discovered IDs using functional setState
      setDiscoveredIds((prev) => {
        const newIds: string[] = [];
        allConvIds.forEach((id) => {
          if (!prev.has(id)) {
            newIds.push(id);
          }
        });
        
        // Notify callback with new IDs
        if (newIds.length > 0 && onDiscoveredIdsRef.current) {
          onDiscoveredIdsRef.current(newIds);
        }
        
        if (newIds.length === 0) return prev;
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
      
      setUndeliveredByConv(countsByConv);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load inbox";
      setError(msg);
      console.error("[useInboxPoll] Fetch error:", e);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [limit]); // Minimal deps — uses refs for callbacks

  // Polling lifecycle — minimal deps to prevent interval churn
  useEffect(() => {
    // Gate: require auth to prevent 401 spam
    if (!isAuthenticated) {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }
    
    // Gate: wait for identity context initialization
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
    
    // Initial fetch on activation
    fetchInbox();
    
    // Set up polling interval
    pollTimerRef.current = window.setInterval(fetchInbox, intervalMs);
    
    // One-shot refresh on focus restore
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
  }, [isAuthenticated, isInitialized, tabVisible, intervalMs, fetchInbox]);

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
