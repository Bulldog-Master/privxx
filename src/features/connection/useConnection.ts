/**
 * useConnection Hook
 * 
 * React hook for managing connection state with event-driven transitions.
 * Replaces timer-based state changes with real connection events.
 */

import { useState, useCallback, useRef } from "react";
import type { ConnectionState, ConnectionResult } from "./types";
import { connect, isLiveMode } from "./connectionService";

export interface UseConnectionOptions {
  /** Callback when connection succeeds */
  onConnect?: (result: ConnectionResult) => void;
  /** Callback when connection fails */
  onError?: (result: ConnectionResult) => void;
  /** Callback on any state change */
  onStateChange?: (state: ConnectionState) => void;
}

export interface UseConnectionReturn {
  /** Current connection state */
  state: ConnectionState;
  /** Whether a connection attempt is in progress */
  isConnecting: boolean;
  /** Whether connected */
  isConnected: boolean;
  /** Last connection result */
  lastResult: ConnectionResult | null;
  /** Initiate a connection */
  connectTo: (url: string) => Promise<ConnectionResult>;
  /** Reset to idle state */
  reset: () => void;
  /** Whether using live cMixx routing */
  isLive: boolean;
}

export function useConnection(options: UseConnectionOptions = {}): UseConnectionReturn {
  const { onConnect, onError, onStateChange } = options;
  
  const [state, setState] = useState<ConnectionState>("idle");
  const [lastResult, setLastResult] = useState<ConnectionResult | null>(null);
  
  // Track in-flight request to prevent duplicate connections
  const inFlightRef = useRef<string | null>(null);

  const updateState = useCallback((newState: ConnectionState) => {
    setState(newState);
    onStateChange?.(newState);
  }, [onStateChange]);

  const connectTo = useCallback(async (url: string): Promise<ConnectionResult> => {
    // Prevent duplicate connection attempts
    if (inFlightRef.current) {
      console.warn("[useConnection] Connection already in progress");
      return {
        success: false,
        sessionId: "",
        requestId: "",
        latency: 0,
        errorCode: "INVALID_MESSAGE",
        errorMessage: "Connection already in progress",
      };
    }

    // Process URL
    let processedUrl = url.trim();
    if (!processedUrl.startsWith("http://") && !processedUrl.startsWith("https://")) {
      processedUrl = "https://" + processedUrl;
    }

    // Generate a tracking ID for this attempt
    const attemptId = crypto.randomUUID().slice(0, 8);
    inFlightRef.current = attemptId;

    console.debug("[useConnection] Starting connection", { attemptId, url: processedUrl });

    // Transition to connecting
    updateState("connecting");

    try {
      // Attempt connection (uses service which handles demo/live mode)
      const result = await connect(processedUrl);

      // Ensure this is still the current attempt
      if (inFlightRef.current !== attemptId) {
        console.debug("[useConnection] Stale connection result ignored", { attemptId });
        return result;
      }

      setLastResult(result);

      if (result.success) {
        // CRITICAL: State transition happens ONLY on successful ACK
        updateState("connected");
        onConnect?.(result);
        console.debug("[useConnection] Connected", {
          attemptId,
          sessionId: result.sessionId,
          latency: result.latency,
        });
      } else {
        // Return to idle on failure
        updateState("idle");
        onError?.(result);
        console.debug("[useConnection] Connection failed", {
          attemptId,
          errorCode: result.errorCode,
          errorMessage: result.errorMessage,
        });
      }

      return result;
    } catch (error) {
      // Handle unexpected errors
      const errorResult: ConnectionResult = {
        success: false,
        sessionId: "",
        requestId: "",
        latency: 0,
        errorCode: "NETWORK_ERROR",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      };

      if (inFlightRef.current === attemptId) {
        setLastResult(errorResult);
        updateState("idle");
        onError?.(errorResult);
      }

      return errorResult;
    } finally {
      // Clear in-flight tracking
      if (inFlightRef.current === attemptId) {
        inFlightRef.current = null;
      }
    }
  }, [updateState, onConnect, onError]);

  const reset = useCallback(() => {
    inFlightRef.current = null;
    setLastResult(null);
    updateState("idle");
  }, [updateState]);

  return {
    state,
    isConnecting: state === "connecting",
    isConnected: state === "connected",
    lastResult,
    connectTo,
    reset,
    isLive: isLiveMode(),
  };
}
