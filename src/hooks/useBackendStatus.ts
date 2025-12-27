import { useEffect, useState, useCallback } from "react";
import { bridgeClient, isMockMode, type StatusResponse } from "@/api/bridge";

export interface BackendStatus {
  /** Bridge status: ok or error */
  status: StatusResponse["status"] | "error";
  /** Backend connection state */
  backend: StatusResponse["backend"] | "error";
  /** Network readiness */
  network: StatusResponse["network"] | "error";
  /** Running in mock mode (no bridge) */
  isMock: boolean;
}

const initialStatus: BackendStatus = {
  status: "ok",
  backend: "disconnected",
  network: "syncing",
  isMock: isMockMode(),
};

export function useBackendStatus(pollMs = 30000) {
  const [data, setData] = useState<BackendStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActive, setIsActive] = useState(!document.hidden);

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
    try {
      const s = await bridgeClient.status();
      setData({
        status: s.status,
        backend: s.backend,
        network: s.network,
        isMock: isMockMode(),
      });
      setError(null);
    } catch {
      setData({
        status: "error",
        backend: "error",
        network: "error",
        isMock: isMockMode(),
      });
      setError("unavailable");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (!isActive) return; // Skip polling when backgrounded

      try {
        const s = await bridgeClient.status();
        if (!alive) return;
        setData({
          status: s.status,
          backend: s.backend,
          network: s.network,
          isMock: isMockMode(),
        });
        setError(null);
      } catch {
        if (!alive) return;
        setData({
          status: "error",
          backend: "error",
          network: "error",
          isMock: isMockMode(),
        });
        setError("unavailable");
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
