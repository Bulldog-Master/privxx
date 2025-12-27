/**
 * Readiness Check Utility
 * 
 * Diagnostics-only, read-only helper for cutover verification.
 * Used to prevent accidental half-live deployments.
 */

import { status, isMockMode } from "@/lib/privxx-api";

export type ReadinessResult = {
  bridgeReachable: boolean;
  backendReady: boolean;
  mockMode: boolean;
};

export async function checkReadiness(): Promise<ReadinessResult> {
  let bridgeReachable = false;
  let backendReady = false;

  try {
    const s = await status();
    bridgeReachable = s?.status === "ok";
    backendReady = s?.backend === "connected" && s?.network === "ready";
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
