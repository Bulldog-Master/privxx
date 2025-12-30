/**
 * Policy Engine Types (Phase-2 Scaffolding)
 * 
 * Defines the decision layer between browser signals and enforcement.
 * No enforcement is implemented - this is pure scaffolding.
 */

export type PolicyDecision =
  | "allow"
  | "warn"
  | "require_reauth"
  | "deny";

export interface PolicyContext {
  anomalies: string[];
  signals: unknown;
  intent?: string;
}

export interface PolicyResult {
  decision: PolicyDecision;
  reason?: string;
  timestamp: number;
}
