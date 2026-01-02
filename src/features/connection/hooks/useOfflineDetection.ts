/**
 * useOfflineDetection Hook
 * 
 * Detects browser online/offline state and provides warnings.
 */

import { useState, useEffect, useCallback } from "react";

export interface UseOfflineDetectionReturn {
  /** Whether browser is online */
  isOnline: boolean;
  /** Whether browser is offline */
  isOffline: boolean;
  /** When offline state was detected */
  offlineSince: Date | null;
  /** Duration offline in seconds */
  offlineDuration: number;
}

export function useOfflineDetection(): UseOfflineDetectionReturn {
  const [isOnline, setIsOnline] = useState(() => 
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [offlineSince, setOfflineSince] = useState<Date | null>(null);
  const [offlineDuration, setOfflineDuration] = useState(0);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setOfflineSince(null);
    setOfflineDuration(0);
    console.debug("[useOfflineDetection] Browser is online");
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setOfflineSince(new Date());
    console.debug("[useOfflineDetection] Browser is offline");
  }, []);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Track offline duration
  useEffect(() => {
    if (!offlineSince) return;

    const interval = setInterval(() => {
      setOfflineDuration(
        Math.floor((Date.now() - offlineSince.getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [offlineSince]);

  return {
    isOnline,
    isOffline: !isOnline,
    offlineSince,
    offlineDuration,
  };
}
