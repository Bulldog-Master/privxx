// src/components/BridgeStatus.tsx
// Phase 1 connection status UI for /health endpoint

import React from "react";
import { fetchHealth, type HealthResponse } from "@/api/bridge/health";

type State =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

export function BridgeStatus() {
  const [state, setState] = React.useState<State>({ kind: "loading" });

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const data = await fetchHealth("https://privxx.app");
        if (alive) setState({ kind: "ok", data });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "unknown error";
        if (alive) setState({ kind: "error", message });
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (state.kind === "loading") {
    return (
      <p className="text-sm text-muted-foreground font-mono p-2 bg-muted/50 rounded">
        Bridge: checking…
      </p>
    );
  }

  if (state.kind === "error") {
    return (
      <p className="text-sm text-destructive font-mono p-2 bg-destructive/10 rounded border border-destructive/20">
        Bridge: OFFLINE ({state.message})
      </p>
    );
  }

  return (
    <p className="text-sm text-green-600 dark:text-green-400 font-mono p-2 bg-green-500/10 rounded border border-green-500/20">
      Bridge: ONLINE ✅ — v{state.data.version} — xxdkReady: {String(state.data.xxdkReady)}
    </p>
  );
}
