/**
 * Bridge Status Utilities
 * 
 * Phase 1: Uses /health endpoint ONLY
 * /status endpoint does not exist in Phase 1 (returns 404)
 * 
 * Provides deterministic status fetching with rate limit parsing
 * and structured UI status types.
 */

import { getBridgeUrl } from "./index";

export type BridgeUiStatus =
  | { kind: "ok"; state: "idle" | "connecting" | "secure" }
  | { kind: "login_required" }
  | { kind: "token_invalid" }
  | { kind: "rate_limited"; retryAfterSec: number; retryUntil: number }
  | { kind: "error"; httpStatus?: number; message?: string };

/**
 * Fetch bridge status using /health endpoint (Phase 1)
 * 
 * Phase 1 contract:
 * - ONLY /health is available
 * - /status returns 404 (does not exist)
 * - Derive status from health response
 */
export async function fetchBridgeStatusRaw(): Promise<{
  ui: BridgeUiStatus;
  latencyMs: number;
  requestId?: string;
}> {
  const startTime = performance.now();
  const baseUrl = getBridgeUrl();
  
  try {
    // Phase 1: Use /health only (public, no auth required)
    const res = await fetch(`${baseUrl}/health`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const requestId = res.headers.get("x-request-id") || undefined;
    
    let bodyJson: Record<string, unknown> | null = null;
    try {
      const bodyText = await res.text();
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    if (res.status === 200) {
      // Health returns: { status: "ok", version: "x.y.z", xxdkReady: boolean }
      // Derive state: if xxdkReady → "idle" (ready to connect)
      const xxdkReady = bodyJson?.xxdkReady === true;
      const state: "idle" | "connecting" | "secure" = xxdkReady ? "idle" : "idle";
      return { ui: { kind: "ok", state }, latencyMs, requestId };
    }

    if (res.status === 429) {
      // Rate limited - parse retry header if available
      const retryAfterSec = 60; // Default fallback
      const retryUntil = Date.now() + retryAfterSec * 1000;
      return { 
        ui: { kind: "rate_limited", retryAfterSec, retryUntil }, 
        latencyMs, 
        requestId 
      };
    }

    return {
      ui: { 
        kind: "error", 
        httpStatus: res.status, 
        message: (bodyJson?.message as string) || (bodyJson?.error as string) || `HTTP ${res.status}` 
      },
      latencyMs,
      requestId,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - startTime);
    const message = err instanceof Error ? err.message : "Network error";
    return {
      ui: { kind: "error", message },
      latencyMs,
    };
  }
}
