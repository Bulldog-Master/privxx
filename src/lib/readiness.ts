/**
 * Readiness Check Utility
 * 
 * Diagnostics-only, read-only helper for cutover verification.
 * Used to prevent accidental half-live deployments.
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
    const s = await bridgeClient.status();
    bridgeReachable = s?.state !== undefined;
    backendReady = s?.state === "secure";
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
