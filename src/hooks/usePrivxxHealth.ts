// src/hooks/usePrivxxHealth.ts
// Phase 1 canonical health hook per PRIVXX Integration Contract
// Use https://api.privxx.app for ALL API calls. Phase 1 supports ONLY GET /health (no /status).
// UI "online/ready" must be derived solely from /health + xxdkReady.

import { useEffect, useRef, useState } from "react";

export type Health = {
  status: "ok";
  version: string;
  xxdkReady: boolean;
};

const HEALTH_URL = "https://api.privxx.app/health";

export function usePrivxxHealth(pollMs: number = 5000) {
  const [data, setData] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const didLogRef = useRef(false);

  useEffect(() => {
    let alive = true;

    // One-time, explicit environment + URL log for contract debugging.
    if (!didLogRef.current) {
      didLogRef.current = true;
      console.info("[Privxx Health] Fetch from browser", {
        origin: window.location.origin,
        url: HEALTH_URL,
        pollMs,
      });
    }

    async function tick() {
      try {
        setError(null);

        const res = await fetch(HEALTH_URL, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          redirect: "follow",
        });

        // If we ever do get a response, log the final URL (after redirects).
        console.info("[Privxx Health] Response", {
          requestedUrl: HEALTH_URL,
          finalUrl: res.url,
          status: res.status,
          ok: res.ok,
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
        // Browser often collapses CORS/TLS failures into a generic TypeError.
        if (e instanceof Error) {
          console.error("[Privxx Health] Fetch failed", {
            name: e.name,
            message: e.message,
            url: HEALTH_URL,
            origin: window.location.origin,
          });
        }

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
