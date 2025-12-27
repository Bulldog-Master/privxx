import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CreditCard, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIdentity } from "@/contexts/IdentityContext";

export function PaymentsPanel() {
  const { t } = useTranslation();
  const { isUnlocked } = useIdentity();
  
  const [destination, setDestination] = useState("https://");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = isUnlocked && destination.trim().length > 8 && amount.trim().length > 0 && !isSubmitting;

  const onPay = async () => {
    setIsSubmitting(true);
    try {
      // Demo-only for now (no backend call unless bridge supports it)
      // Future: bridgeClient.requestPayment({ destination, amount })
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Locked state
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CreditCard className="h-8 w-8 text-muted-foreground mb-3" />
        <h3 className="text-base font-semibold mb-1">
          {t("identityLocked", "Identity Locked")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("paymentsLockedHint", "Unlock identity to make payments")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination" className="text-xs">
          {t("destination", "Destination")}
        </Label>
        <div className="relative">
          <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder={t("destinationPlaceholder", "https://merchant.com")}
            disabled={isSubmitting}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-xs">
          {t("amount", "Amount")}
        </Label>
        <Input
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t("amountPlaceholder", "0.00")}
          disabled={isSubmitting}
          inputMode="decimal"
          className="h-10"
        />
      </div>

      {/* Pay button */}
      <Button 
        className="w-full min-h-[44px]" 
        disabled={!canSubmit} 
        onClick={onPay}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("processing", "Processing...")}
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            {t("pay", "Pay")}
          </>
        )}
      </Button>

      {/* Coming soon notice */}
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
        <div className="text-sm font-semibold">
          {t("paymentsComingSoon", "Payments coming soon")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("paymentsDemoNote", "This is a preview flow. Live settlement will be enabled once the bridge supports payments.")}
        </div>
      </div>
    </div>
  );
}

export default PaymentsPanel;
