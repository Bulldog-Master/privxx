/**
 * Browser Anomaly Policy Engine (Phase-2 Stub)
 * 
 * Provides a decision layer between browser signals and future enforcement.
 * Current implementation is a NO-OP - always returns "allow".
 * 
 * This guarantees:
 * - Clean architecture for future expansion
 * - Auditability of policy decisions
 * - No behavioral changes
 */

import type { PolicyContext, PolicyDecision, PolicyResult } from "./types";

/**
 * Phase-2 stub.
 * Always returns "allow".
 * No enforcement, no side effects.
 */
export function evaluateBrowserAnomalyPolicy(
  context: PolicyContext
): PolicyResult {
  // Placeholder for future logic:
  // - Anomaly thresholds
  // - Risk scoring
  // - Policy rules
  // - Intent-specific handling

  return {
    decision: "allow" as PolicyDecision,
    reason: "Phase-2 stub - no enforcement active",
    timestamp: Date.now(),
  };
}

/**
 * Helper to get just the decision string.
 */
export function getSimplePolicyDecision(context: PolicyContext): PolicyDecision {
  return evaluateBrowserAnomalyPolicy(context).decision;
}
