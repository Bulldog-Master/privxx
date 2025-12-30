/**
 * Payment Intent Submission (Phase-2 Stub)
 * 
 * Frontend-only stub for payment intent capture.
 * Does NOT send network requests or process payments.
 */

import type { PaymentIntent, PaymentIntentResult } from "./types";

/**
 * Phase-2 stub.
 * Logs intent locally for diagnostics.
 * Does NOT send network requests.
 */
export async function submitPaymentIntent(
  intent: PaymentIntent
): Promise<PaymentIntentResult> {
  // Development-only logging
  if (import.meta.env.DEV) {
    console.info("[Payment Intent] Captured (stub):", intent);
  }

  return {
    accepted: true,
    intentId: `stub-${Date.now()}`,
    timestamp: Date.now(),
  };
}
