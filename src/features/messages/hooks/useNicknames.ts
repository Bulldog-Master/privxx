/**
 * useNicknames Hook (Phase-1)
 * 
 * Manages local nickname storage for conversations.
 * Privacy-compliant: nicknames are UI labels only, stored per-user.
 * 
 * Phase-1 compatible: No backend sync, no identity verification.
 * Nicknames are NOT verified contacts — just local labels.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY_PREFIX = "privxx:nicknames:";

type NicknameMap = Record<string, string>; // conversationId → nickname

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadNicknames(userId: string): NicknameMap {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};
    return JSON.parse(raw) as NicknameMap;
  } catch {
    return {};
  }
}

function saveNicknames(userId: string, nicknames: NicknameMap): void {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(nicknames));
  } catch {
    // Storage full or unavailable — non-fatal
  }
}

interface UseNicknamesReturn {
  /** Get nickname for a conversation (undefined if not set) */
  getNickname: (conversationId: string) => string | undefined;
  /** Set nickname for a conversation */
  setNickname: (conversationId: string, nickname: string) => void;
  /** Clear nickname for a conversation */
  clearNickname: (conversationId: string) => void;
  /** Check if conversation has a nickname */
  hasNickname: (conversationId: string) => boolean;
  /** All nicknames (for debugging/export) */
  nicknames: NicknameMap;
}

export function useNicknames(): UseNicknamesReturn {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const [nicknames, setNicknames] = useState<NicknameMap>({});

  // Load from localStorage on auth
  useEffect(() => {
    if (userId && isAuthenticated) {
      setNicknames(loadNicknames(userId));
    } else {
      setNicknames({});
    }
  }, [userId, isAuthenticated]);

  // Persist when nicknames change
  useEffect(() => {
    if (userId && Object.keys(nicknames).length > 0) {
      saveNicknames(userId, nicknames);
    }
  }, [userId, nicknames]);

  const getNickname = useCallback(
    (conversationId: string): string | undefined => nicknames[conversationId],
    [nicknames]
  );

  const setNickname = useCallback((conversationId: string, nickname: string) => {
    const trimmed = nickname.trim();
    if (!trimmed) return; // Don't store empty nicknames
    
    setNicknames((prev) => {
      if (prev[conversationId] === trimmed) return prev;
      return { ...prev, [conversationId]: trimmed };
    });
  }, []);

  const clearNickname = useCallback((conversationId: string) => {
    setNicknames((prev) => {
      if (!(conversationId in prev)) return prev;
      const next = { ...prev };
      delete next[conversationId];
      return next;
    });
  }, []);

  const hasNickname = useCallback(
    (conversationId: string): boolean => conversationId in nicknames,
    [nicknames]
  );

  return {
    getNickname,
    setNickname,
    clearNickname,
    hasNickname,
    nicknames,
  };
}
