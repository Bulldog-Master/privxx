/**
 * ConnectionRetryButton
 * 
 * Inline retry button for connection failures.
 * Compact design for embedding in status areas.
 */

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ConnectionRetryButtonProps {
  onRetry: () => void;
  isRetrying?: boolean;
  compact?: boolean;
}

export function ConnectionRetryButton({
  onRetry,
  isRetrying = false,
  compact = false,
}: ConnectionRetryButtonProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <button
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
        aria-label={t("connection.error.retry", "Try Again")}
      >
        <RefreshCw className={`h-3.5 w-3.5 ${isRetrying ? "animate-spin" : ""}`} />
        <span className="underline underline-offset-2">
          {t("connection.error.retry", "Try Again")}
        </span>
      </button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={onRetry}
      disabled={isRetrying}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
      {isRetrying
        ? t("connection.error.retrying", "Retrying...")
        : t("connection.error.retry", "Try Again")}
    </Button>
  );
}

export default ConnectionRetryButton;
