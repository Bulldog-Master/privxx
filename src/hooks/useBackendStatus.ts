import { useEffect, useState } from "react";
import { status, type StatusRes, isMockMode } from "@/lib/privxx-api";

export interface BackendStatus extends StatusRes {
  isMock: boolean;
}

export function useBackendStatus(pollMs = 30000) {
  const [data, setData] = useState<BackendStatus>({ 
    state: "starting",
    isMock: isMockMode()
  });
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

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const s = await status();
      setData({ ...s, isMock: isMockMode() });
      setError(null);
    } catch {
      setData({ state: "error", detail: "Backend unavailable", isMock: isMockMode() });
      setError("unavailable");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;

    async function tick() {
      if (!isActive) return; // Skip polling when backgrounded
      
      try {
        const s = await status();
        if (!alive) return;
        setData({ ...s, isMock: isMockMode() });
        setError(null);
      } catch {
        if (!alive) return;
        setData({ state: "error", detail: "Backend unavailable", isMock: isMockMode() });
        setError("unavailable");
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    tick();
    const t = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pollMs, isActive]);

  return { status: data, error, isLoading, refetch: fetchStatus };
}
