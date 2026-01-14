/**
 * useConversationList Hook (Phase-1)
 * 
 * Manages conversation list state with:
 * - Inbox polling (20-30s) for undelivered counts + discovery
 * - Lazy preview fetching via thread limit=1
 * - Local persistence of known conversation IDs
 * - Sorting: undelivered first, then by last message time
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentity } from "@/features/identity";
import { bridgeClient } from "@/api/bridge";
import type { MessageItem } from "@/api/bridge/messageTypes";
import {
  ConvMeta,
  loadKnownConversations,
  saveKnownConversations,
  sortConversations,
} from "../conversationTypes";

const INBOX_POLL_MS = 25000; // 20-30s range
const PREVIEW_CACHE_MS = 30000; // 30s preview cache

interface UseConversationListReturn {
  /** Sorted list of conversations */
  conversations: ConvMeta[];
  /** Loading state for initial inbox fetch */
  isLoading: boolean;
  /** Error message if inbox fetch failed */
  error: string | null;
  /** Manually refresh inbox */
  refreshInbox: () => Promise<void>;
  /** Fetch preview for a conversation (lazy) */
  fetchPreview: (conversationId: string) => Promise<void>;
  /** Clear undelivered count locally (after ack) */
  clearUndelivered: (conversationId: string) => void;
  /** Total undelivered across all conversations */
  totalUndelivered: number;
}

export function useConversationList(): UseConversationListReturn {
  const { user, isAuthenticated } = useAuth();
  const { isUnlocked, isInitialized } = useIdentity();
  
  // Known conversation IDs (persisted)
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  // Conversation metadata (in-memory)
  const [convMetaById, setConvMetaById] = useState<Record<string, ConvMeta>>({});
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const userId = user?.id;

  // Load persisted conversation IDs on mount
  useEffect(() => {
    if (userId && isAuthenticated) {
      const saved = loadKnownConversations(userId);
      setKnownIds(saved);
      
      // Initialize convMeta for known IDs (empty counts until inbox fetch)
      const initialMeta: Record<string, ConvMeta> = {};
      saved.forEach((id) => {
        initialMeta[id] = { conversationId: id, undeliveredCount: 0 };
      });
      setConvMetaById(initialMeta);
    }
  }, [userId, isAuthenticated]);

  // Save known IDs when they change
  useEffect(() => {
    if (userId && knownIds.size > 0) {
      saveKnownConversations(userId, knownIds);
    }
  }, [userId, knownIds]);

  /**
   * Fetch inbox and update counts + discover conversations
   */
  const fetchInbox = useCallback(async () => {
    if (!isUnlocked || inFlightRef.current) return;
    inFlightRef.current = true;
    
    setError(null);
    if (convMetaById && Object.keys(convMetaById).length === 0) {
      setIsLoading(true);
    }
    
    try {
      const response = await bridgeClient.fetchInbox({ limit: 100 });
      const items = response.items ?? [];
      
      // Group by conversationId
      const countsByConv: Record<string, number> = {};
      items.forEach((item) => {
        countsByConv[item.conversationId] = (countsByConv[item.conversationId] ?? 0) + 1;
      });
      
      // Discover new conversation IDs
      const newKnownIds = new Set(knownIds);
      Object.keys(countsByConv).forEach((id) => newKnownIds.add(id));
      setKnownIds(newKnownIds);
      
      // Update metadata
      setConvMetaById((prev) => {
        const updated = { ...prev };
        
        // Reset counts for all known conversations first
        newKnownIds.forEach((id) => {
          if (!updated[id]) {
            updated[id] = { conversationId: id, undeliveredCount: 0 };
          } else {
            updated[id] = { ...updated[id], undeliveredCount: 0 };
          }
        });
        
        // Set counts from inbox
        Object.entries(countsByConv).forEach(([convId, count]) => {
          if (updated[convId]) {
            updated[convId] = { ...updated[convId], undeliveredCount: count };
          }
        });
        
        return updated;
      });
      
    } catch (e) {
      // Surface errors for initial inbox load - no special-casing
      const msg = e instanceof Error ? e.message : "Failed to load conversations";
      setError(msg);
      console.error("[ConversationList] Inbox fetch error:", e);
    } finally {
      setIsLoading(false);
      inFlightRef.current = false;
    }
  }, [isUnlocked, knownIds]);

  /**
   * Lazy fetch preview for a conversation (thread limit=1)
   */
  const fetchPreview = useCallback(async (conversationId: string) => {
    const existing = convMetaById[conversationId];
    
    // Skip if recently fetched
    if (existing?.previewFetchedAt && Date.now() - existing.previewFetchedAt < PREVIEW_CACHE_MS) {
      return;
    }
    
    try {
      const response = await bridgeClient.fetchThread({
        conversationId,
        limit: 1,
      });
      
      const items = response.items ?? [];
      const preview: MessageItem | undefined = items[0];
      
      setConvMetaById((prev) => ({
        ...prev,
        [conversationId]: {
          ...prev[conversationId],
          conversationId,
          lastSeenAtUnix: preview?.createdAtUnix,
          lastFp: preview?.envelopeFingerprint,
          lastState: preview?.state,
          previewFetchedAt: Date.now(),
        },
      }));
    } catch (e) {
      console.debug("[ConversationList] Preview fetch error:", e);
    }
  }, [convMetaById]);

  /**
   * Clear undelivered count locally (call after ack)
   */
  const clearUndelivered = useCallback((conversationId: string) => {
    setConvMetaById((prev) => ({
      ...prev,
      [conversationId]: {
        ...prev[conversationId],
        undeliveredCount: 0,
      },
    }));
  }, []);

  // Inbox polling
  useEffect(() => {
    if (!isInitialized || !isUnlocked) {
      // Stop polling when locked
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }
    
    // Initial fetch
    fetchInbox();
    
    // Set up polling
    pollTimerRef.current = window.setInterval(fetchInbox, INBOX_POLL_MS);
    
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
  }, [isInitialized, isUnlocked, fetchInbox]);

  // Build sorted conversation list
  const conversations = sortConversations(Object.values(convMetaById));
  
  // Total undelivered
  const totalUndelivered = conversations.reduce((sum, c) => sum + c.undeliveredCount, 0);

  return {
    conversations,
    isLoading,
    error,
    refreshInbox: fetchInbox,
    fetchPreview,
    clearUndelivered,
    totalUndelivered,
  };
}
