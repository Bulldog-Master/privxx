// src/components/BridgeStatus.tsx
// Phase 1 connection status UI - uses canonical usePrivxxHealth hook
// Per PRIVXX Integration Contract: https://api.privxx.app for ALL API calls

import { usePrivxxHealth } from "@/hooks/usePrivxxHealth";

/**
 * Phase 1 Bridge Status Component
 * Polls GET https://api.privxx.app/health and displays:
 * - API: OFFLINE (fetch failed)
 * - API: CHECKING… (loading)
 * - API: OK · vX.Y.Z · xxDK: READY|STARTING
 */
export function BridgeStatus({ pollMs = 5000 }: { pollMs?: number }) {
  const { data, error } = usePrivxxHealth(pollMs);

  if (error) {
    return (
      <p className="text-sm text-destructive font-mono p-2 bg-destructive/10 rounded border border-destructive/20">
        API: OFFLINE ({error})
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-sm text-muted-foreground font-mono p-2 bg-muted/50 rounded">
        API: CHECKING…
      </p>
    );
  }

  return (
    <p className="text-sm text-green-600 dark:text-green-400 font-mono p-2 bg-green-500/10 rounded border border-green-500/20">
      API: OK · v{data.version} · xxDK: {data.xxdkReady ? "READY" : "STARTING"}
    </p>
  );
}
