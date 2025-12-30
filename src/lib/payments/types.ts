/**
 * Payment Intent Types (Phase-2 Scaffolding)
 * 
 * Decouples user intent from payment execution.
 * Browser only expresses intent - never directly accesses payment providers.
 */

export type PaymentIntentType =
  | "purchase"
  | "subscription"
  | "donation";

export interface PaymentIntent {
  type: PaymentIntentType;
  amount: number;
  currency: string;
  merchantRef: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResult {
  accepted: boolean;
  intentId?: string;
  timestamp: number;
}
