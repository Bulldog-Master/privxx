// src/components/BridgeStatus.tsx
// Phase 1 connection status UI for /health endpoint

import React from "react";
import { fetchHealth, HealthResponse } from "@/api/bridge/health";

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

/**
 * Phase 1 Bridge Status Component
 * Polls GET https://api.privxx.app/health and displays:
 * - API: OFFLINE (fetch failed)
 * - API: CHECKING… (loading)
 * - API: OK · vX.Y.Z · xxDK: READY|STARTING
 */
export function BridgeStatus({ pollMs = 5000 }: { pollMs?: number }) {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    let alive = true;

    async function tick() {
      try {
        const data = await fetchHealth("https://api.privxx.app");
        if (alive) setState({ kind: "ok", data });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "unknown error";
        if (alive) setState({ kind: "error", message });
      }
    }

    tick();
    const id = setInterval(tick, pollMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [pollMs]);

  if (state.kind === "loading") {
    return (
      <p className="text-sm text-muted-foreground font-mono p-2 bg-muted/50 rounded">
        API: CHECKING…
      </p>
    );
  }

  if (state.kind === "error") {
    return (
      <p className="text-sm text-destructive font-mono p-2 bg-destructive/10 rounded border border-destructive/20">
        API: OFFLINE ({state.message})
      </p>
    );
  }

  return (
    <p className="text-sm text-green-600 dark:text-green-400 font-mono p-2 bg-green-500/10 rounded border border-green-500/20">
      API: OK · v{state.data.version} · xxDK: {state.data.xxdkReady ? "READY" : "STARTING"}
    </p>
  );
}
