/**
 * TTL Countdown Hook
 * 
 * Provides real-time countdown for identity unlock expiry.
 */

import { useState, useEffect, useCallback } from "react";

interface TTLCountdownResult {
  remainingMs: number;
  remainingFormatted: string;
  isExpired: boolean;
  isWarning: boolean; // < 2 minutes
  isCritical: boolean; // < 1 minute
  percentRemaining: number;
}

export function useTTLCountdown(
  expiresAt: string | null,
  defaultTTLMs = 15 * 60 * 1000 // 15 minutes default
): TTLCountdownResult {
  const [remainingMs, setRemainingMs] = useState(0);

  const calculateRemaining = useCallback(() => {
    if (!expiresAt) return 0;
    const expiry = new Date(expiresAt).getTime();
    const now = Date.now();
    return Math.max(0, expiry - now);
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      setRemainingMs(0);
      return;
    }

    // Initial calculation
    setRemainingMs(calculateRemaining());

    // Update every second
    const interval = setInterval(() => {
      setRemainingMs(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, calculateRemaining]);

  // Format remaining time
  const formatRemaining = (ms: number): string => {
    if (ms <= 0) return "Expired";
    
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${seconds}s`;
  };

  const isExpired = remainingMs <= 0 && !!expiresAt;
  const isWarning = remainingMs > 0 && remainingMs < 2 * 60 * 1000;
  const isCritical = remainingMs > 0 && remainingMs < 60 * 1000;

  // Calculate percentage remaining (for progress bar)
  const percentRemaining = expiresAt
    ? Math.min(100, Math.max(0, (remainingMs / defaultTTLMs) * 100))
    : 0;

  return {
    remainingMs,
    remainingFormatted: formatRemaining(remainingMs),
    isExpired,
    isWarning,
    isCritical,
    percentRemaining,
  };
}
