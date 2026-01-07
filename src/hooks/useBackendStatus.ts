import { useEffect, useState, useCallback, useRef } from "react";
import { bridgeClient, isMockMode, type StatusResponse } from "@/api/bridge";
import { BridgeError, type BridgeErrorCode } from "@/api/bridge/client";
import { useRateLimitCountdown } from "@/features/diagnostics/hooks/useRateLimitCountdown";

// Auto-retry configuration
const AUTO_RETRY_CONFIG = {
  baseDelayMs: 2000,
  maxDelayMs: 30000,
  maxRetries: 5,
  jitterFactor: 0.2,
};

export type ConnectionHealth = "healthy" | "degraded" | "offline" | "checking";

export interface BackendStatus {
  /** Bridge connection state: idle, connecting, or secure */
  state: StatusResponse["state"] | "error";
  /** Running in mock mode (no bridge) */
  isMock: boolean;
  /** Overall connection health */
  health: ConnectionHealth;
  /** Last successful response time in ms */
  latencyMs: number | null;
  /** Last error code if any */
  lastErrorCode: BridgeErrorCode | null;
  /** Consecutive failure count */
  failureCount: number;
  /** Last successful check timestamp */
  lastSuccessAt: Date | null;
  /** Last check timestamp */
  lastCheckAt: Date | null;
}

export interface AutoRetryState {
  /** Whether auto-retry is active */
  isWaiting: boolean;
  /** Seconds remaining until next retry */
  remainingSec: number;
  /** Formatted countdown string */
  formattedTime: string;
  /** Current attempt number */
  attempt: number;
  /** Maximum retries allowed */
  maxRetries: number;
  /** Whether retries are exhausted */
  isExhausted: boolean;
}

const initialStatus: BackendStatus = {
  state: "idle",
  isMock: isMockMode(),
  health: "checking",
  latencyMs: null,
  lastErrorCode: null,
  failureCount: 0,
  lastSuccessAt: null,
  lastCheckAt: null,
};

const initialAutoRetry: AutoRetryState = {
  isWaiting: false,
  remainingSec: 0,
  formattedTime: "0:00",
  attempt: 0,
  maxRetries: AUTO_RETRY_CONFIG.maxRetries,
  isExhausted: false,
};

// Health thresholds
const LATENCY_DEGRADED_MS = 2000; // Consider degraded if latency > 2s
const FAILURE_DEGRADED_COUNT = 2; // Degraded after 2 failures
const FAILURE_OFFLINE_COUNT = 4; // Offline after 4 failures

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function calculateBackoff(attempt: number): number {
  const { baseDelayMs, maxDelayMs, jitterFactor } = AUTO_RETRY_CONFIG;
  const exponential = baseDelayMs * Math.pow(2, attempt);
  const capped = Math.min(exponential, maxDelayMs);
  const jitterAmount = capped * jitterFactor * (Math.random() * 2 - 1);
  return Math.round(Math.max(1000, capped + jitterAmount));
}

function calculateHealth(
  state: StatusResponse["state"] | "error",
  latencyMs: number | null,
  failureCount: number
): ConnectionHealth {
  // Offline if state is error or high failure count
  if (state === "error" || failureCount >= FAILURE_OFFLINE_COUNT) {
    return "offline";
  }

  // Degraded conditions
  if (
    state === "connecting" ||
    failureCount >= FAILURE_DEGRADED_COUNT ||
    (latencyMs !== null && latencyMs > LATENCY_DEGRADED_MS)
  ) {
    return "degraded";
  }

  // Healthy when secure
  if (state === "secure") {
    return "healthy";
  }

  // Idle is considered healthy (ready to connect)
  if (state === "idle") {
    return "healthy";
  }

  return "degraded";
}

export function useBackendStatus(pollMs = 30000) {
  const [data, setData] = useState<BackendStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(!document.hidden);
  const failureCountRef = useRef(0);
  const isRateLimitedRef = useRef(false);
  
  // Auto-retry state
  const [autoRetry, setAutoRetry] = useState<AutoRetryState>(initialAutoRetry);
  const autoRetryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryAtRef = useRef<number | null>(null);

  const rateLimit = useRateLimitCountdown();

  // Store rate-limit state + functions in refs so polling effects don't re-run every second
  const startCountdownRef = useRef(rateLimit.startCountdown);
  const clearCountdownRef = useRef(rateLimit.clearCountdown);

  useEffect(() => {
    startCountdownRef.current = rateLimit.startCountdown;
    clearCountdownRef.current = rateLimit.clearCountdown;
  }, [rateLimit.startCountdown, rateLimit.clearCountdown]);

  // Keep ref in sync to avoid dependency issues
  useEffect(() => {
    isRateLimitedRef.current = rateLimit.isRateLimited;
  }, [rateLimit.isRateLimited]);

  // Pause polling when app is backgrounded (privacy + performance)
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  
  // Clean up auto-retry timer on unmount
  useEffect(() => {
    return () => {
      if (autoRetryTimerRef.current) clearInterval(autoRetryTimerRef.current);
    };
  }, []);
  
  // Auto-retry countdown tick effect
  useEffect(() => {
    if (!autoRetry.isWaiting || !retryAtRef.current) return;
    
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((retryAtRef.current! - Date.now()) / 1000));
      
      if (remaining <= 0) {
        clearInterval(interval);
        retryAtRef.current = null;
        setAutoRetry(prev => ({
          ...prev,
          isWaiting: false,
          remainingSec: 0,
          formattedTime: "0:00",
        }));
        // Trigger retry
        fetchStatusRef.current();
      } else {
        setAutoRetry(prev => ({
          ...prev,
          remainingSec: remaining,
          formattedTime: formatTime(remaining),
        }));
      }
    }, 1000);
    
    autoRetryTimerRef.current = interval;
    return () => clearInterval(interval);
  }, [autoRetry.isWaiting]);

  // Start auto-retry countdown
  const startAutoRetry = useCallback(() => {
    setAutoRetry(prev => {
      const nextAttempt = prev.attempt + 1;
      
      if (nextAttempt > AUTO_RETRY_CONFIG.maxRetries) {
        return {
          ...prev,
          isWaiting: false,
          isExhausted: true,
          formattedTime: "0:00",
        };
      }
      
      const delayMs = calculateBackoff(nextAttempt - 1);
      const retryAt = Date.now() + delayMs;
      retryAtRef.current = retryAt;
      
      const remainingSec = Math.ceil(delayMs / 1000);
      
      return {
        attempt: nextAttempt,
        isWaiting: true,
        remainingSec,
        isExhausted: false,
        formattedTime: formatTime(remainingSec),
        maxRetries: AUTO_RETRY_CONFIG.maxRetries,
      };
    });
  }, []);
  
  // Reset auto-retry state (on success)
  const resetAutoRetry = useCallback(() => {
    if (autoRetryTimerRef.current) {
      clearInterval(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    retryAtRef.current = null;
    setAutoRetry(initialAutoRetry);
  }, []);
  
  // Skip countdown and retry immediately
  const retryNow = useCallback(() => {
    if (autoRetryTimerRef.current) {
      clearInterval(autoRetryTimerRef.current);
      autoRetryTimerRef.current = null;
    }
    retryAtRef.current = null;
    setAutoRetry(prev => ({
      ...prev,
      isWaiting: false,
      remainingSec: 0,
      formattedTime: "0:00",
    }));
    fetchStatusRef.current();
  }, []);
  
  // Cancel auto-retry
  const cancelAutoRetry = useCallback(() => {
    resetAutoRetry();
  }, [resetAutoRetry]);

  const fetchStatus = useCallback(async () => {
    // Avoid hammering the bridge while rate limited
    if (isRateLimitedRef.current) return;

    setIsLoading(true);
    const startTime = performance.now();
    const checkTime = new Date();

    try {
      const s = await bridgeClient.status();
      const latencyMs = Math.round(performance.now() - startTime);

      // Reset failure count and auto-retry on success
      failureCountRef.current = 0;
      clearCountdownRef.current();
      resetAutoRetry();

      const health = calculateHealth(s.state, latencyMs, 0);

      setData({
        state: s.state,
        isMock: isMockMode(),
        health,
        latencyMs,
        lastErrorCode: null,
        failureCount: 0,
        lastSuccessAt: checkTime,
        lastCheckAt: checkTime,
      });
      setError(null);
    } catch (err) {
      // Handle unauthorized - this means no valid session yet, not a real failure
      // Skip incrementing failure count; just wait for auth to complete
      if (err instanceof BridgeError && err.code === "UNAUTHORIZED") {
        setData((prev) => ({
          ...prev,
          isMock: isMockMode(),
          // Keep previous health (likely "checking") - don't mark as offline
          health: prev.health === "checking" ? "checking" : prev.health,
          latencyMs: null,
          lastErrorCode: "UNAUTHORIZED",
          lastCheckAt: checkTime,
        }));
        setError("UNAUTHORIZED");
        setIsLoading(false);
        return;
      }

      // Handle explicit rate limiting without incrementing failure counters
      if (err instanceof BridgeError && err.code === "RATE_LIMITED") {
        const retryAfterSec = err.retryAfterSec ?? 60;
        startCountdownRef.current(Date.now() + retryAfterSec * 1000);
        resetAutoRetry(); // Don't auto-retry when rate limited

        setData((prev) => ({
          ...prev,
          isMock: isMockMode(),
          // Keep previous state; mark health degraded to avoid showing "Offline"
          health: "degraded",
          latencyMs: null,
          lastErrorCode: "RATE_LIMITED",
          lastCheckAt: checkTime,
        }));
        setError("RATE_LIMITED");
        return;
      }

      failureCountRef.current += 1;

      const errorCode: BridgeErrorCode = err instanceof BridgeError ? err.code : "NETWORK_ERROR";

      const health = calculateHealth("error", null, failureCountRef.current);

      setData((prev) => ({
        state: "error",
        isMock: isMockMode(),
        health,
        latencyMs: null,
        lastErrorCode: errorCode,
        failureCount: failureCountRef.current,
        lastSuccessAt: prev.lastSuccessAt,
        lastCheckAt: checkTime,
      }));
      setError(errorCode);
      
      // Start auto-retry for network/timeout errors (retryable errors)
      const isRetryable = errorCode === "NETWORK_ERROR" || errorCode === "TIMEOUT" || errorCode === "SERVER_ERROR";
      if (isRetryable && !autoRetry.isExhausted) {
        startAutoRetry();
      }
    } finally {
      setIsLoading(false);
    }
  }, [resetAutoRetry, startAutoRetry, autoRetry.isExhausted]);

  // Store fetchStatus in ref to avoid interval recreating on each render
  const fetchStatusRef = useRef(fetchStatus);
  useEffect(() => {
    fetchStatusRef.current = fetchStatus;
  }, [fetchStatus]);

  useEffect(() => {
    // Skip polling entirely if pollMs is 0 (disabled)
    if (pollMs === 0) {
      setIsLoading(false);
      return;
    }

    let alive = true;

    async function tick() {
      if (!alive) return;
      if (!isActive) return; // Skip polling when backgrounded
      if (isRateLimitedRef.current) return; // Skip polling while rate limited
      // Skip regular polling while auto-retry is active
      if (autoRetry.isWaiting) return;
      await fetchStatusRef.current();
    }

    tick();
    const interval = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [pollMs, isActive, autoRetry.isWaiting]);

  return { 
    status: data, 
    error, 
    isLoading, 
    refetch: fetchStatus, 
    rateLimit,
    autoRetry: {
      ...autoRetry,
      retryNow,
      cancel: cancelAutoRetry,
    },
  };
}
