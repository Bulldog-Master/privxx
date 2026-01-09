/**
 * useConnectWithPolling
 * 
 * Handles the connect flow with /status polling after success.
 * Polls every 1s, max 10 attempts, stops when state === "secure" or SessionLockedError.
 */

import { useState, useCallback, useRef } from "react";
import { bridgeClient, SessionLockedError } from "@/api/bridge";
import type { StatusResponse } from "@/api/bridge/types";

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

export interface ConnectPollingResult {
  state: ConnectPollingState;
  statusData: StatusResponse | null;
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

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const abortRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
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

      // Step 2: Start polling /status
      setResult(prev => ({ ...prev, state: "polling", pollAttempt: 1 }));

      let attemptCount = 1;

      const pollStatus = async (): Promise<boolean> => {
        if (abortRef.current) return true; // Stop if aborted

        try {
          const status = await bridgeClient.status();
          
          if (status.state === "secure") {
            stopPolling();
            setResult({
              state: "secure",
              statusData: status,
              error: null,
              pollAttempt: attemptCount,
            });
            return true;
          }

          attemptCount++;
          setResult(prev => ({ ...prev, pollAttempt: attemptCount }));

          if (attemptCount > MAX_POLL_ATTEMPTS) {
            stopPolling();
            setResult({
              state: "timeout",
              statusData: status,
              error: "Connection pending — try again",
              pollAttempt: attemptCount,
            });
            return true;
          }

          return false;
        } catch (err) {
          if (err instanceof SessionLockedError) {
            stopPolling();
            setResult({
              state: "session_locked",
              statusData: null,
              error: err.message,
              pollAttempt: attemptCount,
            });
            onSessionLocked?.();
            return true;
          }
          throw err;
        }
      };

      // First poll immediately
      const done = await pollStatus();
      if (done) return;

      // Then poll every 1s
      pollingRef.current = setInterval(async () => {
        try {
          const isDone = await pollStatus();
          if (isDone) {
            stopPolling();
          }
        } catch (err) {
          stopPolling();
          const message = err instanceof Error ? err.message : "Polling failed";
          setResult(prev => ({
            ...prev,
            state: "error",
            error: message,
          }));
        }
      }, POLL_INTERVAL_MS);

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
