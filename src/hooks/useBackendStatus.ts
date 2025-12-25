import { useEffect, useState } from "react";
import { status, type StatusRes, isMockMode } from "@/lib/privxx-api";

export interface BackendStatus {
  state: StatusRes["state"];
  detail?: string;
  isMock: boolean;
}

export function useBackendStatus(pollMs: number = 30_000) {
  const [data, setData] = useState<BackendStatus>({ 
    state: "starting",
    isMock: isMockMode()
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const s = await status();
        if (!alive) return;
        setData({ ...s, isMock: isMockMode() });
        setError(null);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || "Status check failed");
        setData({ state: "error", detail: "Backend unavailable", isMock: isMockMode() });
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
  }, [pollMs]);

  return { status: data, error, isLoading };
}
