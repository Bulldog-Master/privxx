import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Loader2, ExternalLink, Shield, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIdentity } from "@/features/identity";
import { LockedState } from "@/components/shared";
import { submitPaymentIntentWithPolicy } from "@/lib/payments";
import { collectBrowserAnomalySignals, detectAnomalies } from "@/lib/browserAnomalySignals";

export function PaymentsPanel() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  const signals = useMemo(() => collectBrowserAnomalySignals(), []);
  const anomalies = useMemo(() => detectAnomalies(signals), [signals]);

  const [destination, setDestination] = useState("https://");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"XX" | "USD">("XX");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return isUnlocked && destination.trim().length > 8 && amount.trim().length > 0 && !isSubmitting;
  }, [isUnlocked, destination, amount, isSubmitting]);

  const onPay = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      // Phase-2: Submit intent through policy engine (stub - always allows)
      await submitPaymentIntentWithPolicy(
        {
          type: "purchase",
          amount: parseFloat(amount) || 0,
          currency,
          merchantRef: destination,
        },
        anomalies,
        signals as unknown as Record<string, unknown>
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isUnlocked) {
    return <LockedState hintKey="paymentsLockedHint" />;
  }

  return (
    <div className="p-4 space-y-4">
      {/* Privacy notice */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-start gap-3">
        <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-primary">
            {t("payments.privacyTitle", "Private Payment Intents")}
          </p>
          <p className="text-xs text-primary/70">
            {t("payments.privacyDescription", "Your browser never talks directly to payment providers. Intents are routed through the Bridge for private execution.")}
          </p>
        </div>
      </div>

      {/* Destination URL */}
      <div className="space-y-1">
        <Label htmlFor="destination" className="text-sm font-medium text-primary/80">
          {t("destination", "Destination")}
        </Label>
        <div className="relative">
          <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
          <Input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={t("destinationPlaceholder", "https://merchant.com")}
            disabled={isSubmitting}
            className="pl-9 h-10 border-primary/40 text-primary placeholder:text-primary/50"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <p className="text-xs text-primary/60">
          {t("destinationHint", "Enter a merchant URL or payment destination (Preview).")}
        </p>
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 space-y-1">
          <Label htmlFor="amount" className="text-sm font-medium text-primary/80">
            {t("amount", "Amount")}
          </Label>
          <Input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={t("amountPlaceholder", "0.00")}
            disabled={isSubmitting}
            inputMode="decimal"
            className="h-10 border-primary/40 text-primary placeholder:text-primary/50"
          />
        </div>

        <div className="col-span-1 space-y-1">
          <Label htmlFor="currency" className="text-sm font-medium text-primary/80">
            {t("currency", "Currency")}
          </Label>
          <select
            id="currency"
            className="w-full rounded-md border-2 border-primary/40 bg-background px-3 py-2 h-10 text-sm text-primary ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as "XX" | "USD")}
            disabled={isSubmitting}
          >
            <option value="XX">{t("currencyXX", "XX")}</option>
            <option value="USD">{t("currencyUSD", "USD")}</option>
          </select>
        </div>
      </div>

      {/* Create Intent button */}
      <Button
        className="w-full min-h-[44px]"
        disabled={!canSubmit}
        onClick={onPay}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("payments.creatingIntent", "Creating Intent…")}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {t("payments.createIntent", "Create Payment Intent")}
          </>
        )}
      </Button>

      {/* Phase status */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-1">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">
            {t("payments.status", "Status")}: {t("payments.comingSoon", "Phase 3")}
          </span>
        </div>
        <p className="text-xs text-amber-400/80">
          {t("payments.statusNote", "Intent capture is active. Private execution will be enabled once the Bridge supports payment rails.")}
        </p>
      </div>
    </div>
  );
}

export default PaymentsPanel;
