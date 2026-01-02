/**
 * useConnectionHistory Hook
 * 
 * Tracks connection attempts with timestamps and results.
 * Persists to session storage for debugging.
 */

import { useState, useCallback, useEffect } from "react";
import type { ConnectionResult } from "../types";

export interface ConnectionHistoryEntry {
  id: string;
  url: string;
  timestamp: string;
  success: boolean;
  latency: number;
  errorCode?: string;
  sessionId?: string;
}

export interface UseConnectionHistoryReturn {
  /** All connection history entries */
  history: ConnectionHistoryEntry[];
  /** Add a new entry */
  addEntry: (url: string, result: ConnectionResult) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Get last N entries */
  getRecent: (count: number) => ConnectionHistoryEntry[];
  /** Success rate percentage */
  successRate: number;
}

const STORAGE_KEY = "privxx_connection_history";
const MAX_ENTRIES = 50;

export function useConnectionHistory(): UseConnectionHistoryReturn {
  const [history, setHistory] = useState<ConnectionHistoryEntry[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Persist to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Storage full or unavailable
    }
  }, [history]);

  const addEntry = useCallback((url: string, result: ConnectionResult) => {
    const entry: ConnectionHistoryEntry = {
      id: crypto.randomUUID().slice(0, 8),
      url,
      timestamp: new Date().toISOString(),
      success: result.success,
      latency: result.latency,
      errorCode: result.errorCode,
      sessionId: result.sessionId,
    };

    setHistory((prev) => {
      const updated = [entry, ...prev].slice(0, MAX_ENTRIES);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const getRecent = useCallback(
    (count: number) => history.slice(0, count),
    [history]
  );

  const successRate = history.length > 0
    ? Math.round((history.filter((e) => e.success).length / history.length) * 100)
    : 0;

  return {
    history,
    addEntry,
    clearHistory,
    getRecent,
    successRate,
  };
}
