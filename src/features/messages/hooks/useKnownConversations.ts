/**
 * useKnownConversations Hook (Phase-1)
 * 
 * Manages persistent storage of known conversation IDs per user.
 * Privacy-compliant: stores only opaque conversation IDs, no PII.
 * 
 * Phase-1 compatible: No protocol changes, frontend-only.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  loadKnownConversations,
  saveKnownConversations,
} from "../conversationTypes";

interface UseKnownConversationsReturn {
  /** Set of known conversation IDs */
  knownConversationIds: Set<string>;
  /** Add a conversation ID to known set */
  addConversationId: (id: string) => void;
  /** Add multiple conversation IDs */
  addConversationIds: (ids: string[]) => void;
  /** Remove a conversation ID (optional cleanup) */
  removeConversationId: (id: string) => void;
  /** Check if ID is known */
  isKnown: (id: string) => boolean;
}

export function useKnownConversations(): UseKnownConversationsReturn {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    if (userId && isAuthenticated) {
      const saved = loadKnownConversations(userId);
      setKnownIds(saved);
    } else {
      setKnownIds(new Set());
    }
  }, [userId, isAuthenticated]);

  // Persist when knownIds changes
  useEffect(() => {
    if (userId && knownIds.size > 0) {
      saveKnownConversations(userId, knownIds);
    }
  }, [userId, knownIds]);

  const addConversationId = useCallback((id: string) => {
    setKnownIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const addConversationIds = useCallback((ids: string[]) => {
    setKnownIds((prev) => {
      const next = new Set(prev);
      let changed = false;
      ids.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, []);

  const removeConversationId = useCallback((id: string) => {
    setKnownIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isKnown = useCallback((id: string) => knownIds.has(id), [knownIds]);

  return {
    knownConversationIds: knownIds,
    addConversationId,
    addConversationIds,
    removeConversationId,
    isKnown,
  };
}
