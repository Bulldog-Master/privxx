/**
 * Browser Policy Decision Hook (Phase-2 Scaffolding)
 * 
 * Provides reactive access to policy decisions for diagnostics.
 * No enforcement - diagnostics display only.
 */

import { useMemo } from "react";
import { evaluateBrowserAnomalyPolicy } from "@/lib/policy/browserAnomalyPolicy";
import type { PolicyContext, PolicyResult } from "@/lib/policy/types";

export function useBrowserPolicyDecision(context: PolicyContext): PolicyResult {
  return useMemo(() => {
    return evaluateBrowserAnomalyPolicy(context);
  }, [context]);
}
