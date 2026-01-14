/**
 * useConversationList Hook (Phase-1)
 * 
 * Orchestrates conversation list state by combining modular hooks:
 * - useKnownConversations: persistent ID storage
 * - useInboxPoll: undelivered counts + discovery
 * - useConversationPreviews: lazy preview fetching
 * - useNicknames: local nickname storage
 * 
 * Phase-1 compatible: No protocol changes, frontend-only optimization.
 */

import { useMemo, useCallback, useEffect } from "react";
import { useKnownConversations } from "./useKnownConversations";
import { useInboxPoll } from "./useInboxPoll";
import { useConversationPreviews } from "./useConversationPreviews";
import { useNicknames } from "./useNicknames";
import type { ConvMeta } from "../conversationTypes";
import { sortConversations } from "../conversationTypes";

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
  fetchPreview: (conversationId: string) => void;
  /** Clear undelivered count locally (after ack) */
  clearUndelivered: (conversationId: string) => void;
  /** Total undelivered across all conversations */
  totalUndelivered: number;
  /** Get nickname for a conversation */
  getNickname: (conversationId: string) => string | undefined;
  /** Set nickname for a conversation */
  setNickname: (conversationId: string, nickname: string) => void;
  /** Clear nickname for a conversation */
  clearNickname: (conversationId: string) => void;
}

export function useConversationList(): UseConversationListReturn {
  // Modular hooks
  const { 
    knownConversationIds, 
    addConversationIds 
  } = useKnownConversations();
  
  const {
    undeliveredByConv,
    isLoading,
    error,
    totalUndelivered,
    refreshInbox,
  } = useInboxPoll({
    onDiscoveredIds: addConversationIds,
  });
  
  const {
    getPreview,
    requestPreview,
    fetchTopN,
    clearPreview,
  } = useConversationPreviews();

  const {
    getNickname,
    setNickname,
    clearNickname,
  } = useNicknames();

  // Build conversation metadata from known IDs + inbox counts + previews
  const conversations = useMemo(() => {
    const convs: ConvMeta[] = [];
    
    // Start with known conversation IDs
    knownConversationIds.forEach((id) => {
      const preview = getPreview(id);
      const undeliveredCount = undeliveredByConv[id] ?? 0;
      
      convs.push({
        conversationId: id,
        undeliveredCount,
        lastSeenAtUnix: preview?.lastSeenAtUnix,
        lastFp: preview?.lastFp,
        lastState: preview?.lastState,
        previewFetchedAt: preview?.fetchedAt,
      });
    });
    
    // Also include any discovered IDs not yet in known set
    Object.keys(undeliveredByConv).forEach((id) => {
      if (!knownConversationIds.has(id)) {
        const preview = getPreview(id);
        convs.push({
          conversationId: id,
          undeliveredCount: undeliveredByConv[id],
          lastSeenAtUnix: preview?.lastSeenAtUnix,
          lastFp: preview?.lastFp,
          lastState: preview?.lastState,
          previewFetchedAt: preview?.fetchedAt,
        });
      }
    });
    
    return sortConversations(convs);
  }, [knownConversationIds, undeliveredByConv, getPreview]);

  // Eagerly fetch previews for top 20 conversations on initial load
  // Use topKey to trigger on order changes, not just length
  const topKey = conversations.slice(0, 20).map((c) => c.conversationId).join("|");
  
  useEffect(() => {
    if (topKey && !isLoading) {
      const topIds = topKey.split("|");
      fetchTopN(topIds, 20);
    }
  }, [topKey, isLoading, fetchTopN]);

  // Wrapper to request preview with priority refresh for undelivered
  const fetchPreview = useCallback((conversationId: string) => {
    const hasUndelivered = (undeliveredByConv[conversationId] ?? 0) > 0;
    requestPreview(conversationId, hasUndelivered); // force=true if undelivered
  }, [requestPreview, undeliveredByConv]);

  // Clear undelivered + invalidate preview cache
  const clearUndelivered = useCallback((conversationId: string) => {
    // Preview will be refetched on next request since cache is cleared
    clearPreview(conversationId);
  }, [clearPreview]);

  return {
    conversations,
    isLoading,
    error,
    refreshInbox,
    fetchPreview,
    clearUndelivered,
    totalUndelivered,
    getNickname,
    setNickname,
    clearNickname,
  };
}
