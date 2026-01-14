/**
 * useThread Hook (Phase-1)
 * 
 * Visibility-gated thread fetching with:
 * - IntersectionObserver for lazy loading
 * - Tab visibility pause
 * - Automatic ack of available messages (delivery bookkeeping only)
 * 
 * Phase-1 compatible: No protocol changes, frontend-only optimization.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { bridgeClient } from "@/api/bridge";
import type { MessageItem } from "@/api/bridge/messageTypes";
import { useVisibilityGate } from "./useVisibilityGate";
import { useTabVisibility } from "./useTabVisibility";

interface UseThreadOptions {
  /** Conversation ID to load */
  conversationId: string;
  /** Max messages to fetch (default: 50) */
  limit?: number;
  /** Ref to container element for visibility detection */
  containerRef: React.RefObject<Element>;
  /** Callback when messages are acked */
  onMessagesAcked?: (conversationId: string) => void;
}

interface UseThreadReturn {
  /** Thread messages (sorted chronologically for display) */
  messages: MessageItem[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if failed */
  error: string | null;
  /** Server time from response */
  serverTime: string | null;
  /** Whether ack is in progress */
  ackInProgress: boolean;
  /** Manually reload thread */
  reload: () => Promise<void>;
}

export function useThread({
  conversationId,
  limit = 50,
  containerRef,
  onMessagesAcked,
}: UseThreadOptions): UseThreadReturn {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<string | null>(null);
  const [ackInProgress, setAckInProgress] = useState(false);
  
  // Visibility gating
  const isVisible = useVisibilityGate(containerRef, 0.2);
  const tabVisible = useTabVisibility();
  
  // Deduplication refs
  const loadedConvRef = useRef<string | null>(null);
  const ackedConvRef = useRef<string | null>(null);

  /**
   * Ack available messages (delivery bookkeeping only)
   */
  const ackAvailableMessages = useCallback(async (availableItems: MessageItem[]) => {
    if (availableItems.length === 0) return;
    
    setAckInProgress(true);
    
    try {
      const fingerprints = availableItems.map((m) => m.envelopeFingerprint);
      
      const result = await bridgeClient.ackMessages({
        conversationId,
        envelopeFingerprints: fingerprints,
      });
      
      console.debug("[useThread] Acked messages:", result.acked);
      
      // Update local state: available → consumed
      setMessages((prev) =>
        prev.map((m) =>
          fingerprints.includes(m.envelopeFingerprint)
            ? { ...m, state: "consumed" as const }
            : m
        )
      );
      
      // Notify parent
      if (onMessagesAcked) {
        onMessagesAcked(conversationId);
      }
    } catch (err) {
      // Non-critical: log but don't surface
      console.warn("[useThread] Failed to ack:", err);
    } finally {
      setAckInProgress(false);
    }
  }, [conversationId, onMessagesAcked]);

  /**
   * Load thread from bridge
   */
  const loadThread = useCallback(async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await bridgeClient.fetchThread({
        conversationId,
        limit,
      });
      
      const items = response.items ?? [];
      setMessages(items);
      setServerTime(response.serverTime);
      
      // Ack available messages (if not already acked for this conversation)
      if (ackedConvRef.current !== conversationId) {
        const availableItems = items.filter((m) => m.state === "available");
        if (availableItems.length > 0) {
          await ackAvailableMessages(availableItems);
        }
        ackedConvRef.current = conversationId;
      }
    } catch (err) {
      console.error("[useThread] Load failed:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, limit, ackAvailableMessages]);

  // Reset refs when conversation changes
  useEffect(() => {
    if (conversationId !== loadedConvRef.current) {
      loadedConvRef.current = null;
      ackedConvRef.current = null;
    }
  }, [conversationId]);

  // Visibility-gated loading
  useEffect(() => {
    // Pause when tab is backgrounded
    if (!tabVisible) return;
    
    // Wait until visible in viewport
    if (!isVisible) return;
    
    // Only load once per conversation per mount
    if (loadedConvRef.current === conversationId) return;
    
    loadedConvRef.current = conversationId;
    void loadThread();
  }, [tabVisible, isVisible, conversationId, loadThread]);

  // Sort chronologically for display (best-effort ordering)
  const chronologicalMessages = [...messages].sort((a, b) => a.createdAtUnix - b.createdAtUnix);

  return {
    messages: chronologicalMessages,
    isLoading,
    error,
    serverTime,
    ackInProgress,
    reload: loadThread,
  };
}
