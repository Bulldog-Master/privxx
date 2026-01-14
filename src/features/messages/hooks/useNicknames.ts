/**
 * useNicknames Hook (Phase-1)
 * 
 * Manages local nickname storage for conversations.
 * Privacy-compliant: nicknames are UI labels only, stored per-user.
 * 
 * Phase-1 compatible: No backend sync, no identity verification.
 * Nicknames are NOT verified contacts — just local labels.
 */

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const STORAGE_KEY_PREFIX = "privxx:nicknames:";

export type NicknameMap = Record<string, string>; // conversationId -> nickname

function getStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadNicknames(userId: string): NicknameMap {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === "object" ? parsed : {}) as NicknameMap;
  } catch {
    return {};
  }
}

function saveNicknames(userId: string, nicknames: NicknameMap): void {
  try {
    const key = getStorageKey(userId);
    if (Object.keys(nicknames).length === 0) {
      localStorage.removeItem(key); // important: clearing must persist
      return;
    }
    localStorage.setItem(key, JSON.stringify(nicknames));
  } catch {
    // non-fatal (storage full/unavailable)
  }
}

interface UseNicknamesReturn {
  getNickname: (conversationId: string) => string | undefined;
  setNickname: (conversationId: string, nickname: string) => void;
  clearNickname: (conversationId: string) => void;
  hasNickname: (conversationId: string) => boolean;
  nicknames: NicknameMap;
}

export function useNicknames(): UseNicknamesReturn {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const [nicknames, setNicknames] = useState<NicknameMap>({});

  // Load on auth, reset on logout
  useEffect(() => {
    if (isAuthenticated && userId) {
      setNicknames(loadNicknames(userId));
    } else {
      setNicknames({});
    }
  }, [isAuthenticated, userId]);

  // Persist on any change (including empty -> remove key)
  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    saveNicknames(userId, nicknames);
  }, [isAuthenticated, userId, nicknames]);

  const getNickname = useCallback(
    (conversationId: string) => nicknames[conversationId],
    [nicknames]
  );

  const setNickname = useCallback(
    (conversationId: string, nickname: string) => {
      if (!isAuthenticated || !userId) return;
      const trimmed = nickname.trim();
      if (!trimmed) return;

      setNicknames((prev) => {
        if (prev[conversationId] === trimmed) return prev;
        return { ...prev, [conversationId]: trimmed };
      });
    },
    [isAuthenticated, userId]
  );

  const clearNickname = useCallback(
    (conversationId: string) => {
      if (!isAuthenticated || !userId) return;

      setNicknames((prev) => {
        if (!(conversationId in prev)) return prev;
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    },
    [isAuthenticated, userId]
  );

  const hasNickname = useCallback(
    (conversationId: string) => conversationId in nicknames,
    [nicknames]
  );

  return { getNickname, setNickname, clearNickname, hasNickname, nicknames };
}
