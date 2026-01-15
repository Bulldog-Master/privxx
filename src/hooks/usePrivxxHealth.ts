// src/hooks/usePrivxxHealth.ts
// Phase 1 canonical health hook per PRIVXX Integration Contract
// Use https://api.privxx.app for ALL API calls. Phase 1 supports ONLY GET /health (no /status).
// UI "online/ready" must be derived solely from /health + xxdkReady.

import { useEffect, useState } from "react";

export type Health = {
  status: "ok";
  version: string;
  xxdkReady: boolean;
};

export function usePrivxxHealth(pollMs: number = 5000) {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        setError(null);

        const res = await fetch("https://api.privxx.app/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const txt = await res.text();

        let json: Health | null = null;
        try {
          json = txt ? (JSON.parse(txt) as Health) : null;
        } catch {
          json = null;
        }

        if (!res.ok || !json) throw new Error(`HTTP ${res.status}`);

        if (alive) setData(json);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Network error");
      }
    }

    tick();
    const id = setInterval(tick, pollMs);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  return { data, error };
}
