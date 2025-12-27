import { useEffect, useState, useCallback, useRef } from "react";
import { bridgeClient, isMockMode, type StatusResponse } from "@/api/bridge";
import { BridgeError, type BridgeErrorCode } from "@/api/bridge/client";

export type ConnectionHealth = "healthy" | "degraded" | "offline" | "checking";

export interface BackendStatus {
  /** Bridge status: ok or error */
  status: StatusResponse["status"] | "error";
  /** Backend connection state */
  backend: StatusResponse["backend"] | "error";
  /** Network readiness */
  network: StatusResponse["network"] | "error";
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
  status: "ok",
  backend: "disconnected",
  network: "syncing",
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
  status: StatusResponse["status"] | "error",
  backend: StatusResponse["backend"] | "error",
  network: StatusResponse["network"] | "error",
  latencyMs: number | null,
  failureCount: number
): ConnectionHealth {
  // Offline if status is error or high failure count
  if (status === "error" || failureCount >= FAILURE_OFFLINE_COUNT) {
    return "offline";
  }

  // Degraded conditions
  if (
    backend === "disconnected" ||
    network === "syncing" ||
    failureCount >= FAILURE_DEGRADED_COUNT ||
    (latencyMs !== null && latencyMs > LATENCY_DEGRADED_MS)
  ) {
    return "degraded";
  }

  // Healthy
  if (status === "ok" && backend === "connected" && network === "ready") {
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

  // Pause polling when app is backgrounded (privacy + performance)
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsActive(!document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    const startTime = performance.now();
    const checkTime = new Date();

    try {
      const s = await bridgeClient.status();
      const latencyMs = Math.round(performance.now() - startTime);
      
      // Reset failure count on success
      failureCountRef.current = 0;
      
      const health = calculateHealth(s.status, s.backend, s.network, latencyMs, 0);
      
      setData({
        status: s.status,
        backend: s.backend,
        network: s.network,
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
      failureCountRef.current += 1;
      
      const errorCode: BridgeErrorCode = err instanceof BridgeError 
        ? err.code 
        : "NETWORK_ERROR";
      
      const health = calculateHealth("error", "error", "error", null, failureCountRef.current);
      
      setData(prev => ({
        status: "error",
        backend: "error",
        network: "error",
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

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (!isActive) return; // Skip polling when backgrounded

      const startTime = performance.now();
      const checkTime = new Date();

      try {
        const s = await bridgeClient.status();
        if (!alive) return;
        
        const latencyMs = Math.round(performance.now() - startTime);
        
        // Reset failure count on success
        failureCountRef.current = 0;
        
        const health = calculateHealth(s.status, s.backend, s.network, latencyMs, 0);
        
        setData({
          status: s.status,
          backend: s.backend,
          network: s.network,
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
        if (!alive) return;
        
        failureCountRef.current += 1;
        
        const errorCode: BridgeErrorCode = err instanceof BridgeError 
          ? err.code 
          : "NETWORK_ERROR";
        
        const health = calculateHealth("error", "error", "error", null, failureCountRef.current);
        
        setData(prev => ({
          status: "error",
          backend: "error",
          network: "error",
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
        if (alive) setIsLoading(false);
      }
    }

    tick();
    const interval = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(interval);
    };
  }, [pollMs, isActive]);

  return { status: data, error, isLoading, refetch: fetchStatus };
}
