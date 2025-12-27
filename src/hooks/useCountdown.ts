/**
 * Countdown hook for TTL display
 */

import { useState, useEffect, useCallback } from "react";

interface CountdownResult {
  timeLeft: number; // seconds remaining
  isExpired: boolean;
  formatted: string; // "MM:SS" format
}

export function useCountdown(expiresAt: string | null): CountdownResult {
  const [timeLeft, setTimeLeft] = useState(0);

  const calculateTimeLeft = useCallback(() => {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  }, [expiresAt]);

  useEffect(() => {
    if (!expiresAt) {
      setTimeLeft(0);
      return;
    }

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, calculateTimeLeft]);

  const isExpired = timeLeft <= 0 && expiresAt !== null;

  // Format as MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formatted = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return { timeLeft, isExpired, formatted };
}
