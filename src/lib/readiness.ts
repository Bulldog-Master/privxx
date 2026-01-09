/**
 * Readiness Check Utility
 * 
 * Diagnostics-only, read-only helper for cutover verification.
 * Used to prevent accidental half-live deployments.
 * 
 * IMPORTANT: Uses /health (public) instead of /status to avoid rate-limit loops.
 * Status checks are handled by useBackendStatus with proper rate-limit protection.
 */

import { bridgeClient, isMockMode } from "@/api/bridge";

export type ReadinessResult = {
  bridgeReachable: boolean;
  backendReady: boolean;
  mockMode: boolean;
};

export async function checkReadiness(): Promise<ReadinessResult> {
  let bridgeReachable = false;
  let backendReady = false;

  try {
    // Use /health (public) instead of /status to avoid rate-limit conflicts
    const h = await bridgeClient.health();
    bridgeReachable = h?.status === "ok";
    // backendReady requires status check - leave as false here
    // The actual status is shown via useBackendStatus in the UI
    backendReady = bridgeReachable; // Approximate: if health passes, backend is reachable
  } catch {
    bridgeReachable = false;
    backendReady = false;
  }

  return {
    bridgeReachable,
    backendReady,
    mockMode: isMockMode(),
  };
}
