/**
 * useConversationPreviews Hook (Phase-1)
 * 
 * Manages lazy preview fetching for conversations with:
 * - TTL cache (15-60s)
 * - Priority refresh for undelivered > 0
 * - Top-N eager fetch for first 20 rows
 * 
 * Phase-1 compatible: No protocol changes, frontend-only optimization.
 */

import { useState, useCallback, useRef } from "react";
import { bridgeClient } from "@/api/bridge";
import type { MessageItem } from "@/api/bridge/messageTypes";

const PREVIEW_CACHE_TTL_MS = 30000; // 30s cache

export interface PreviewData {
  /** Unix timestamp of last message */
  lastSeenAtUnix?: number;
  /** Envelope fingerprint of last message */
  lastFp?: string;
  /** State of last message */
  lastState?: "available" | "consumed";
  /** When preview was fetched */
  fetchedAt: number;
}

interface UseConversationPreviewsReturn {
  /** Get cached preview for a conversation */
  getPreview: (conversationId: string) => PreviewData | undefined;
  /** Request preview fetch (lazy, respects cache) */
  requestPreview: (conversationId: string, force?: boolean) => void;
  /** Eagerly fetch previews for top N conversations */
  fetchTopN: (conversationIds: string[], n?: number) => void;
  /** Clear preview cache for a conversation */
  clearPreview: (conversationId: string) => void;
}

export function useConversationPreviews(): UseConversationPreviewsReturn {
  const [previews, setPreviews] = useState<Record<string, PreviewData>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  /**
   * Fetch preview for a single conversation
   */
  const fetchPreview = useCallback(async (conversationId: string) => {
    // Skip if already in flight
    if (inFlightRef.current.has(conversationId)) return;
    
    inFlightRef.current.add(conversationId);
    
    try {
      const response = await bridgeClient.fetchThread({
        conversationId,
        limit: 1,
      });
      
      const items = response.items ?? [];
      const preview: MessageItem | undefined = items[0];
      
      setPreviews((prev) => ({
        ...prev,
        [conversationId]: {
          lastSeenAtUnix: preview?.createdAtUnix,
          lastFp: preview?.envelopeFingerprint,
          lastState: preview?.state,
          fetchedAt: Date.now(),
        },
      }));
    } catch (e) {
      // Non-fatal: log but don't surface
      console.debug("[useConversationPreviews] Fetch error:", e);
    } finally {
      inFlightRef.current.delete(conversationId);
    }
  }, []);

  /**
   * Get cached preview (undefined if not fetched)
   */
  const getPreview = useCallback((conversationId: string): PreviewData | undefined => {
    return previews[conversationId];
  }, [previews]);

  /**
   * Request preview fetch (respects TTL cache unless force=true)
   */
  const requestPreview = useCallback((conversationId: string, force = false) => {
    const existing = previews[conversationId];
    
    // Skip if recently fetched (within TTL)
    if (!force && existing && Date.now() - existing.fetchedAt < PREVIEW_CACHE_TTL_MS) {
      return;
    }
    
    fetchPreview(conversationId);
  }, [previews, fetchPreview]);

  /**
   * Eagerly fetch previews for top N conversations (for initial load)
   */
  const fetchTopN = useCallback((conversationIds: string[], n = 20) => {
    const topIds = conversationIds.slice(0, n);
    
    topIds.forEach((id) => {
      requestPreview(id);
    });
  }, [requestPreview]);

  /**
   * Clear preview cache for a conversation (e.g., after ack)
   */
  const clearPreview = useCallback((conversationId: string) => {
    setPreviews((prev) => {
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  return {
    getPreview,
    requestPreview,
    fetchTopN,
    clearPreview,
  };
}
