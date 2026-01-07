/**
 * useAutoRetry Hook
 * 
 * Manages automatic retry with exponential backoff for connection errors.
 * Provides countdown timer and configurable retry limits.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export interface AutoRetryConfig {
  /** Base delay in ms (default: 2000) */
  baseDelayMs?: number;
  /** Maximum delay in ms (default: 30000) */
  maxDelayMs?: number;
  /** Maximum retry attempts (default: 5) */
  maxRetries?: number;
  /** Jitter factor 0-1 (default: 0.2) */
  jitterFactor?: number;
}

export interface AutoRetryState {
  /** Current attempt number (0 = not started) */
  attempt: number;
  /** Whether currently waiting to retry */
  isWaiting: boolean;
  /** Seconds remaining until next retry */
  remainingSec: number;
  /** Whether max retries exceeded */
  isExhausted: boolean;
  /** Formatted time string (e.g., "0:05") */
  formattedTime: string;
}

export interface UseAutoRetryReturn extends AutoRetryState {
  /** Start auto-retry cycle */
  start: () => void;
  /** Reset state (on success or manual cancel) */
  reset: () => void;
  /** Skip wait and retry immediately */
  retryNow: () => void;
  /** Callback to trigger on retry (set via startWithCallback) */
  onRetry: (() => void) | null;
}

const DEFAULT_CONFIG: Required<AutoRetryConfig> = {
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  maxRetries: 5,
  jitterFactor: 0.2,
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function calculateBackoff(
  attempt: number,
  baseMs: number,
  maxMs: number,
  jitter: number
): number {
  // Exponential backoff: base * 2^attempt
  const exponential = baseMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxMs);
  // Add jitter (±jitter%)
  const jitterAmount = capped * jitter * (Math.random() * 2 - 1);
  return Math.round(Math.max(1000, capped + jitterAmount));
}

export function useAutoRetry(
  onRetryCallback: () => void | Promise<void>,
  config: AutoRetryConfig = {}
): UseAutoRetryReturn {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const [state, setState] = useState<AutoRetryState>({
    attempt: 0,
    isWaiting: false,
    remainingSec: 0,
    isExhausted: false,
    formattedTime: "0:00",
  });
  
  const onRetryRef = useRef(onRetryCallback);
  onRetryRef.current = onRetryCallback;
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const retryAtRef = useRef<number | null>(null);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  
  // Tick countdown every second
  useEffect(() => {
    if (!state.isWaiting || !retryAtRef.current) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((retryAtRef.current! - Date.now()) / 1000));
      
      if (remaining <= 0) {
        // Time to retry
        clearInterval(interval);
        setState(prev => ({
          ...prev,
          isWaiting: false,
          remainingSec: 0,
          formattedTime: "0:00",
        }));
        retryAtRef.current = null;
        // Trigger retry
        onRetryRef.current();
      } else {
        setState(prev => ({
          ...prev,
          remainingSec: remaining,
          formattedTime: formatTime(remaining),
        }));
      }
    }, 1000);
    
    timerRef.current = interval;
    return () => clearInterval(interval);
  }, [state.isWaiting]);
  
  const start = useCallback(() => {
    setState(prev => {
      const nextAttempt = prev.attempt + 1;
      
      if (nextAttempt > cfg.maxRetries) {
        return {
          ...prev,
          isWaiting: false,
          isExhausted: true,
          formattedTime: "0:00",
        };
      }
      
      const delayMs = calculateBackoff(
        nextAttempt - 1,
        cfg.baseDelayMs,
        cfg.maxDelayMs,
        cfg.jitterFactor
      );
      const retryAt = Date.now() + delayMs;
      retryAtRef.current = retryAt;
      
      const remainingSec = Math.ceil(delayMs / 1000);
      
      return {
        attempt: nextAttempt,
        isWaiting: true,
        remainingSec,
        isExhausted: false,
        formattedTime: formatTime(remainingSec),
      };
    });
  }, [cfg]);
  
  const reset = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    retryAtRef.current = null;
    setState({
      attempt: 0,
      isWaiting: false,
      remainingSec: 0,
      isExhausted: false,
      formattedTime: "0:00",
    });
  }, []);
  
  const retryNow = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    retryAtRef.current = null;
    setState(prev => ({
      ...prev,
      isWaiting: false,
      remainingSec: 0,
      formattedTime: "0:00",
    }));
    onRetryRef.current();
  }, []);
  
  return {
    ...state,
    start,
    reset,
    retryNow,
    onRetry: onRetryCallback,
  };
}
