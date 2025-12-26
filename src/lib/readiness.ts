/**
 * Readiness Check Utility
 * 
 * Diagnostics-only, read-only helper for cutover verification.
 * Used to prevent accidental half-live deployments.
 */

import { health, status } from "@/lib/privxx-api";

export type ReadinessResult = {
  proxyReachable: boolean;
  backendReady: boolean;
  mockMode: boolean;
};

export async function checkReadiness(): Promise<ReadinessResult> {
  let proxyReachable = false;
  let backendReady = false;

  try {
    const h = await health();
    proxyReachable = !!h?.ok;
  } catch {
    proxyReachable = false;
  }

  try {
    const s = await status();
    backendReady = s?.state === "ready";
  } catch {
    backendReady = false;
  }

  const mockMode =
    (import.meta as any).env?.VITE_USE_MOCKS === "true" || true; // Default to mock mode

  return {
    proxyReachable,
    backendReady,
    mockMode,
  };
}
