/**
 * Bridge Status Utilities
 * 
 * Provides deterministic status fetching with rate limit parsing
 * and structured UI status types.
 */

import { bridgeClient, getBridgeUrl } from "./index";
import { supabase } from "@/integrations/supabase/client";

export type BridgeUiStatus =
  | { kind: "ok"; state: "idle" | "connecting" | "secure" }
  | { kind: "login_required" }
  | { kind: "token_invalid" }
  | { kind: "rate_limited"; retryAfterSec: number; retryUntil: number }
  | { kind: "error"; httpStatus?: number; message?: string };

/**
 * Parse Retry-After header from response
 * Supports both seconds (number) and HTTP-date formats
 */
function parseRetryAfterSeconds(headers: Headers, bodyJson?: { retryAfter?: number }): number | null {
  // First check body for retryAfter (our bridge returns this)
  if (bodyJson?.retryAfter && typeof bodyJson.retryAfter === "number" && bodyJson.retryAfter > 0) {
    return Math.ceil(bodyJson.retryAfter);
  }

  // Standard Retry-After header
  const ra = headers.get("retry-after");
  if (ra) {
    const n = Number(ra);
    if (!Number.isNaN(n) && n > 0) return Math.ceil(n);
    // Could be a date string - try to parse
    const date = Date.parse(ra);
    if (!Number.isNaN(date)) {
      return Math.max(1, Math.ceil((date - Date.now()) / 1000));
    }
  }

  // Common non-standard: X-RateLimit-Reset (epoch seconds)
  const reset = headers.get("x-ratelimit-reset");
  if (reset) {
    const epoch = Number(reset);
    if (!Number.isNaN(epoch) && epoch > 0) {
      const nowSec = Math.floor(Date.now() / 1000);
      return Math.max(1, epoch - nowSec);
    }
  }

  return null;
}

/**
 * Fetch bridge status with full error classification
 * Returns structured UI status for deterministic display
 */
export async function fetchBridgeStatusRaw(): Promise<{
  ui: BridgeUiStatus;
  latencyMs: number;
  correlationId?: string;
}> {
  const startTime = performance.now();
  const baseUrl = getBridgeUrl();
  
  // Get fresh token from Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  try {
    const res = await fetch(`${baseUrl}/status`, {
      method: "GET",
      headers: accessToken 
        ? { "Authorization": `Bearer ${accessToken}` } 
        : undefined,
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const correlationId = res.headers.get("x-correlation-id") || undefined;
    
    let bodyJson: Record<string, unknown> | null = null;
    try {
      const bodyText = await res.text();
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch {
      bodyJson = null;
    }

    if (res.status === 200) {
      const state = (bodyJson?.state as "idle" | "connecting" | "secure") ?? "idle";
      return { ui: { kind: "ok", state }, latencyMs, correlationId };
    }

    if (res.status === 401) {
      const code = bodyJson?.code as string | undefined;
      if (code === "missing_token") {
        return { ui: { kind: "login_required" }, latencyMs, correlationId };
      }
      return { ui: { kind: "token_invalid" }, latencyMs, correlationId };
    }

    if (res.status === 429) {
      const retryAfterSec = parseRetryAfterSeconds(res.headers, bodyJson as { retryAfter?: number }) ?? 60;
      const retryUntil = Date.now() + retryAfterSec * 1000;
      return { 
        ui: { kind: "rate_limited", retryAfterSec, retryUntil }, 
        latencyMs, 
        correlationId 
      };
    }

    return {
      ui: { 
        kind: "error", 
        httpStatus: res.status, 
        message: (bodyJson?.message as string) || (bodyJson?.error as string) || `HTTP ${res.status}` 
      },
      latencyMs,
      correlationId,
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
