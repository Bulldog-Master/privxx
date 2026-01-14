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
  const didFirstLoadRef = useRef(false);
  
  // Stable refs to avoid interval churn from closing over changing state
  const onDiscoveredIdsRef = useRef(onDiscoveredIds);
  onDiscoveredIdsRef.current = onDiscoveredIds;

  const fetchInbox = useCallback(async () => {
    // Phase-1: poll even while locked (ciphertext-only), but require auth to prevent 401 spam
    if (!isAuthenticated) return;
    if (inFlightRef.current) return;
    
    inFlightRef.current = true;
    setError(null);
    
    // Show spinner only until we get the first successful payload
    if (!didFirstLoadRef.current) {
      setIsLoading(true);
    }
    
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
      
      // ✅ Mark first successful load only on success
      didFirstLoadRef.current = true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load inbox";
      setError(msg);
      console.error("[useInboxPoll] Fetch error:", e);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [isAuthenticated, limit]); // Minimal deps — uses refs for callbacks

  // Polling lifecycle — simplified cleanup via effect return
  useEffect(() => {
    // Gates: all must be true to poll
    const canPoll = isAuthenticated && isInitialized && tabVisible;
    if (!canPoll) return;
    
    // Define focus handler before adding listener
    const handleFocus = () => fetchInbox();
    
    // One initial fetch on activation (async tick avoids racing focus event)
    setTimeout(() => fetchInbox(), 0);
    
    // Set up polling interval
    const timerId = window.setInterval(fetchInbox, intervalMs);
    window.addEventListener("focus", handleFocus);
    
    // Cleanup handles all stop conditions
    return () => {
      window.clearInterval(timerId);
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
