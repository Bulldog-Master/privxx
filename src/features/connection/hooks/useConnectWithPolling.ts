/**
 * useConnectWithPolling
 * 
 * Phase 1: Uses /health endpoint ONLY for polling.
 * /status endpoint does not exist in Phase 1 (returns 404).
 * 
 * Polls /health every 1s, EXACTLY 10 attempts max.
 * In Phase 1, success means xxdkReady === true.
 */

import { useState, useCallback, useRef } from "react";
import { bridgeClient, SessionLockedError } from "@/api/bridge";
import type { HealthResponse } from "@/api/bridge/types";

const POLL_INTERVAL_MS = 1000;
const MAX_POLL_ATTEMPTS = 10;

export type ConnectPollingState = 
  | "idle" 
  | "connecting" 
  | "polling" 
  | "secure" 
  | "timeout" 
  | "session_locked"
  | "error";

// Phase 1: Simplified status derived from /health
// Includes optional fields for backwards compatibility with UI components
export interface Phase1StatusData {
  state: "idle" | "connecting" | "secure";
  xxdkReady: boolean;
  version: string;
  // Optional fields for UI compatibility (not available in Phase 1)
  targetUrl?: string;
  sessionId?: string;
  latency?: number;
}

export interface ConnectPollingResult {
  state: ConnectPollingState;
  statusData: Phase1StatusData | null;
  error: string | null;
  pollAttempt: number;
}

export interface UseConnectWithPollingReturn {
  result: ConnectPollingResult;
  connect: (targetUrl: string) => Promise<void>;
  reset: () => void;
  isConnecting: boolean;
  isPolling: boolean;
  isSecure: boolean;
  isTimeout: boolean;
  isSessionLocked: boolean;
}

export function useConnectWithPolling(
  onSessionLocked?: () => void
): UseConnectWithPollingReturn {
  const [result, setResult] = useState<ConnectPollingResult>({
    state: "idle",
    statusData: null,
    error: null,
    pollAttempt: 0,
  });

  const abortRef = useRef(false);
  const pollingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    stopPolling();
    setResult({
      state: "idle",
      statusData: null,
      error: null,
      pollAttempt: 0,
    });
  }, [stopPolling]);

  const connect = useCallback(async (targetUrl: string) => {
    abortRef.current = false;
    stopPolling();
    
    setResult({
      state: "connecting",
      statusData: null,
      error: null,
      pollAttempt: 0,
    });

    try {
      // Step 1: POST /connect
      const connectResponse = await bridgeClient.connect(targetUrl);
      
      if (!connectResponse.success) {
        setResult({
          state: "error",
          statusData: null,
          error: "Connection failed",
          pollAttempt: 0,
        });
        return;
      }

      // Step 2: Poll /health (Phase 1 - /status doesn't exist)
      // In Phase 1, we consider connection "secure" after connect succeeds
      // and /health shows xxdkReady === true
      let attemptCount = 0;

      const pollOnce = async (): Promise<void> => {
        if (abortRef.current) return;

        attemptCount++;
        setResult(prev => ({ ...prev, state: "polling", pollAttempt: attemptCount }));

        try {
          // Phase 1: Use /health instead of /status
          const health: HealthResponse = await bridgeClient.health();
          
          const statusData: Phase1StatusData = {
            state: health.xxdkReady ? "secure" : "connecting",
            xxdkReady: health.xxdkReady,
            version: health.version,
          };

          if (health.xxdkReady) {
            // In Phase 1, xxdkReady after connect = success
            setResult({
              state: "secure",
              statusData,
              error: null,
              pollAttempt: attemptCount,
            });
            return;
          }

          // Check if we've reached max attempts
          if (attemptCount >= MAX_POLL_ATTEMPTS) {
            setResult({
              state: "timeout",
              statusData,
              error: "Connection pending — try again",
              pollAttempt: attemptCount,
            });
            return;
          }

          // Schedule next poll with setTimeout (prevents overlapping)
          pollingTimeoutRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS);

        } catch (err) {
          if (err instanceof SessionLockedError) {
            setResult({
              state: "session_locked",
              statusData: null,
              error: err.message,
              pollAttempt: attemptCount,
            });
            onSessionLocked?.();
            return;
          }

          // Other errors
          const message = err instanceof Error ? err.message : "Polling failed";
          setResult(prev => ({
            ...prev,
            state: "error",
            error: message,
          }));
        }
      };

      // Start first poll immediately
      await pollOnce();

    } catch (err) {
      stopPolling();
      
      if (err instanceof SessionLockedError) {
        setResult({
          state: "session_locked",
          statusData: null,
          error: err.message,
          pollAttempt: 0,
        });
        onSessionLocked?.();
        return;
      }

      const message = err instanceof Error ? err.message : "Connection failed";
      setResult({
        state: "error",
        statusData: null,
        error: message,
        pollAttempt: 0,
      });
    }
  }, [stopPolling, onSessionLocked]);

  return {
    result,
    connect,
    reset,
    isConnecting: result.state === "connecting",
    isPolling: result.state === "polling",
    isSecure: result.state === "secure",
    isTimeout: result.state === "timeout",
    isSessionLocked: result.state === "session_locked",
  };
}
