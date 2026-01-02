/**
 * useAutoReconnect Hook
 * 
 * Automatically retries connection when browser comes back online.
 */

import { useEffect, useRef, useCallback } from "react";
import { useOfflineDetection } from "./useOfflineDetection";

export interface UseAutoReconnectOptions {
  /** Whether auto-reconnect is enabled */
  enabled?: boolean;
  /** Delay before reconnecting after coming online (ms) */
  delay?: number;
  /** Callback to trigger reconnection */
  onReconnect: () => void;
  /** Whether a connection attempt is currently in progress */
  isConnecting?: boolean;
  /** Whether already connected */
  isConnected?: boolean;
}

export interface UseAutoReconnectReturn {
  /** Whether browser is online */
  isOnline: boolean;
  /** Whether browser is offline */
  isOffline: boolean;
  /** Time offline in seconds */
  offlineDuration: number;
  /** Whether auto-reconnect is pending */
  isPendingReconnect: boolean;
}

export function useAutoReconnect({
  enabled = true,
  delay = 1000,
  onReconnect,
  isConnecting = false,
  isConnected = false,
}: UseAutoReconnectOptions): UseAutoReconnectReturn {
  const { isOnline, isOffline, offlineDuration } = useOfflineDetection();
  const wasOfflineRef = useRef(false);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPendingRef = useRef(false);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Handle coming back online
  useEffect(() => {
    if (!enabled) return;

    // Track when we go offline
    if (isOffline) {
      wasOfflineRef.current = true;
      // Cancel any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
        isPendingRef.current = false;
      }
      return;
    }

    // We're online - check if we were offline and should reconnect
    if (wasOfflineRef.current && !isConnecting && !isConnected) {
      console.debug("[useAutoReconnect] Back online, scheduling reconnect...");
      isPendingRef.current = true;
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.debug("[useAutoReconnect] Triggering auto-reconnect");
        isPendingRef.current = false;
        onReconnect();
      }, delay);
    }

    // Reset offline tracking
    wasOfflineRef.current = false;
  }, [isOnline, isOffline, enabled, delay, onReconnect, isConnecting, isConnected]);

  return {
    isOnline,
    isOffline,
    offlineDuration,
    isPendingReconnect: isPendingRef.current,
  };
}
