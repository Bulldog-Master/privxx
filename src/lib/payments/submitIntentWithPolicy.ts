/**
 * Policy-Aware Payment Intent Submission (Phase-2 Stub)
 * 
 * Routes payment intent through the policy engine before processing.
 * Current implementation always allows - no enforcement active.
 */

import type { PaymentIntent, PaymentIntentResult } from "./types";
import { submitPaymentIntent } from "./submitIntent";
import { evaluateBrowserAnomalyPolicy } from "@/lib/policy/browserAnomalyPolicy";

/**
 * Submit payment intent with policy evaluation.
 * Phase-2: Policy always returns "allow".
 */
export async function submitPaymentIntentWithPolicy(
  intent: PaymentIntent,
  anomalies: string[],
  signals: unknown
): Promise<PaymentIntentResult> {
  const policyResult = evaluateBrowserAnomalyPolicy({
    intent: intent.type,
    anomalies,
    signals,
  });

  // Development-only logging
  if (import.meta.env.DEV) {
    console.info("[Payment Policy] Decision:", policyResult);
  }

  // Phase-2 rule: always allow
  // Future: handle warn, require_reauth, deny
  if (policyResult.decision !== "allow") {
    throw new Error("Payment blocked by policy");
  }

  return submitPaymentIntent(intent);
}
