import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { DemoMessage, InboxState } from "./types";
import { mergeMessages } from "./merge";
import { useIdentity } from "@/features/identity";
import { bridgeClient } from "@/api/bridge";
import type { Message } from "@/api/bridge";

const POLL_MS = 4000; // 3–5s window per spec

/**
 * Normalize bridge Message to DemoMessage format
 */
function normalizeMessage(raw: Message, index: number): DemoMessage {
  // Bridge returns: { from, message, timestamp }
  // We need: { messageId, from, body, timestamp (epoch) }
  const ts = raw.timestamp 
    ? new Date(raw.timestamp).getTime() 
    : Date.now();
  
  return {
    // Generate ID from content hash since bridge doesn't provide one
    messageId: `${raw.from}:${raw.message}:${raw.timestamp}:${index}`,
    from: raw.from,
    body: raw.message,
    timestamp: ts,
    optimistic: false,
  };
}

export function useInbox() {
  const { isUnlocked, isInitialized, state: identityState } = useIdentity();
  const [state, setState] = useState<InboxState>({
    messages: [],
    isLoading: false,
  });


  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const lastUnlockedAtRef = useRef<number | null>(null);
  const prevUnlockedRef = useRef<boolean>(isUnlocked);

  // Prevent brief error-state flashing (e.g., during unlock/session settle or transient fetch failures)
  const errorTimerRef = useRef<number | null>(null);
  const consecutiveFailuresRef = useRef(0);

  const clearErrorTimer = useCallback(() => {
    if (errorTimerRef.current) {
      window.clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }, []);

  const clearPolling = useCallback(() => {
    clearErrorTimer();
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [clearErrorTimer]);


  const fetchOnce = useCallback(async () => {
    if (!isUnlocked) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;


    const t0 = performance.now();

    // If a new request is starting, cancel any pending "show error" timer.
    clearErrorTimer();

    setState((s) => ({
      ...s,
      isLoading: s.messages.length === 0,
      error: undefined,
    }));


    try {
      const raw = await bridgeClient.getInbox();
      const incoming = raw.map(normalizeMessage);

      consecutiveFailuresRef.current = 0;
      clearErrorTimer();

      setState((s) => ({
        ...s,
        isLoading: false,
        messages: mergeMessages(s.messages, incoming),
        lastUpdated: Date.now(),
      }));

      const dt = Math.round(performance.now() - t0);
      console.debug("[inbox] ok", { count: incoming.length, ms: dt });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to load messages";
      const dt = Math.round(performance.now() - t0);

      // Prevent post-unlock error flashing: immediately after unlocking, the bridge can briefly
      // reject inbox reads while internal session state settles.
      const lastUnlockedAt = lastUnlockedAtRef.current;
      const isWithinWarmup = lastUnlockedAt !== null && Date.now() - lastUnlockedAt < 1500;
      if (isWithinWarmup) {
        console.warn("[inbox] warmup-suppressed", { ms: dt, error: msg });
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      consecutiveFailuresRef.current += 1;

      // If we already have messages, never swap the whole panel into an error state.
      // This avoids "flash on/off" when a single poll fails.
      if (state.messages.length > 0) {
        console.warn("[inbox] soft-error", {
          ms: dt,
          error: msg,
          failures: consecutiveFailuresRef.current,
        });
        setState((s) => ({ ...s, isLoading: false }));
        return;
      }

      // Debounce error display to avoid brief flashes when the next poll succeeds.
      if (!errorTimerRef.current) {
        errorTimerRef.current = window.setTimeout(() => {
          errorTimerRef.current = null;
          setState((s) => ({ ...s, isLoading: false, error: msg }));
        }, 600);
      }

      console.warn("[inbox] error", { ms: dt, error: msg, failures: consecutiveFailuresRef.current });
    } finally {
      inFlightRef.current = false;
    }
  }, [isUnlocked, clearErrorTimer, state.messages.length]);

  // Handle lock/unlock state changes - BUT wait for identity to be initialized
  useEffect(() => {
    // Track unlock transitions for warmup suppression
    if (!prevUnlockedRef.current && isUnlocked) {
      lastUnlockedAtRef.current = Date.now();
    }
    prevUnlockedRef.current = isUnlocked;

    // Don't start anything until identity context has finished its first check
    if (!isInitialized) return;

    // During identity transitions (unlock/lock/status refresh), do not clear messages.
    // This prevents the Inbox from flashing the "locked" prompt mid-transition.
    if (identityState === "loading") {
      clearPolling();
      return;
    }

    if (!isUnlocked) {
      // Stop polling and clear state when locked
      clearPolling();
      setState({ messages: [], isLoading: false, error: undefined });
      return;
    }

    // Start polling when unlocked
    fetchOnce();
    clearPolling();
    timerRef.current = window.setInterval(fetchOnce, POLL_MS);

    return () => clearPolling();
  }, [isUnlocked, isInitialized, identityState, fetchOnce, clearPolling]);

  const status = useMemo(() => {
    if (!isUnlocked) return "locked";
    if (state.error) return "error";
    return "ready";
  }, [isUnlocked, state.error]);

  // Optimistic message insertion
  const addOptimistic = useCallback((message: DemoMessage) => {
    setState((s) => ({
      ...s,
      messages: mergeMessages(s.messages, [message]),
    }));
  }, []);

  // Remove optimistic message (on send failure)
  const removeOptimistic = useCallback((messageId: string) => {
    setState((s) => ({
      ...s,
      messages: s.messages.filter((m) => m.messageId !== messageId),
    }));
  }, []);

  return { 
    ...state, 
    status, 
    refresh: fetchOnce,
    addOptimistic,
    removeOptimistic,
  };
}
