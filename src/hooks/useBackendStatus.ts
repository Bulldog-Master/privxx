import { useEffect, useState, useCallback, useRef } from "react";
import { bridgeClient, isMockMode, type StatusResponse } from "@/api/bridge";
import { BridgeError, type BridgeErrorCode } from "@/api/bridge/client";
import { useRateLimitCountdown } from "@/features/diagnostics/hooks/useRateLimitCountdown";

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

// Health thresholds
const LATENCY_DEGRADED_MS = 2000; // Consider degraded if latency > 2s
const FAILURE_DEGRADED_COUNT = 2; // Degraded after 2 failures
const FAILURE_OFFLINE_COUNT = 4; // Offline after 4 failures

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

  const fetchStatus = useCallback(async () => {
    // Avoid hammering the bridge while rate limited
    if (isRateLimitedRef.current) return;

    setIsLoading(true);
    const startTime = performance.now();
    const checkTime = new Date();

    try {
      const s = await bridgeClient.status();
      const latencyMs = Math.round(performance.now() - startTime);

      // Reset failure count on success
      failureCountRef.current = 0;
      clearCountdownRef.current();

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
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      await fetchStatusRef.current();
    }

    tick();
    const interval = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [pollMs, isActive]);

  return { status: data, error, isLoading, refetch: fetchStatus, rateLimit };
}
