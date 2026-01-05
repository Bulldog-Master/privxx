import { useState, useEffect, useCallback, useRef } from "react";

interface RateLimitState {
  isRateLimited: boolean;
  remainingSec: number;
  retryUntil: number | null;
}

/**
 * Hook to manage rate limit countdown
 * Automatically ticks every second and triggers callback when expired
 */
export function useRateLimitCountdown(onExpired?: () => void) {
  const [state, setState] = useState<RateLimitState>({
    isRateLimited: false,
    remainingSec: 0,
    retryUntil: null,
  });
  
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  // Start countdown with retryUntil timestamp
  const startCountdown = useCallback((retryUntil: number) => {
    const remaining = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
    setState({
      isRateLimited: remaining > 0,
      remainingSec: remaining,
      retryUntil,
    });
  }, []);

  // Clear countdown
  const clearCountdown = useCallback(() => {
    setState({
      isRateLimited: false,
      remainingSec: 0,
      retryUntil: null,
    });
  }, []);

  // Tick every second
  useEffect(() => {
    if (!state.isRateLimited || !state.retryUntil) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((state.retryUntil! - Date.now()) / 1000));
      
      if (remaining <= 0) {
        setState({
          isRateLimited: false,
          remainingSec: 0,
          retryUntil: null,
        });
        onExpiredRef.current?.();
      } else {
        setState(prev => ({
          ...prev,
          remainingSec: remaining,
        }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRateLimited, state.retryUntil]);

  return {
    ...state,
    startCountdown,
    clearCountdown,
    formattedTime: formatTime(state.remainingSec),
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
