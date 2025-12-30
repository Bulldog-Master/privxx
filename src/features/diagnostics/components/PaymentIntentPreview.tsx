import { useTranslation } from "react-i18next";
import { CreditCard, Info } from "lucide-react";

/**
 * Phase-2 diagnostic component.
 * Shows a preview of what a payment intent looks like.
 * No network calls, no real payments.
 */
export function PaymentIntentPreview() {
  const { t } = useTranslation();

  const sampleIntent = {
    type: "purchase",
    amount: 25,
    currency: "USD",
    merchantRef: "example.com",
    timestamp: new Date().toISOString(),
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-card/50 backdrop-blur-sm p-4 space-y-3">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold text-primary">
          {t("diagnostics.paymentIntent.title", "Payment Intent (Preview)")}
        </h3>
      </div>

      <pre className="rounded-lg bg-background/80 border border-border/50 p-3 text-xs font-mono text-muted-foreground overflow-x-auto">
        {JSON.stringify(sampleIntent, null, 2)}
      </pre>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <p>{t("diagnostics.paymentIntent.disclaimer", "Diagnostic preview only. No payment is created or sent.")}</p>
      </div>

      <div className="pt-2 border-t border-border/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {t("diagnostics.paymentIntent.status", "Status")}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
            {t("diagnostics.paymentIntent.comingSoon", "Phase 3")}
          </span>
        </div>
      </div>
    </div>
  );
}
