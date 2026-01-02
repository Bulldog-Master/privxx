/**
 * OfflineWarning
 * 
 * Shows warning banner when browser is offline.
 */

import { WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OfflineWarningProps {
  offlineDuration?: number;
  onRetryClick?: () => void;
}

export function OfflineWarning({ offlineDuration, onRetryClick }: OfflineWarningProps) {
  const { t } = useTranslation();

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <Alert
      variant="destructive"
      className="bg-destructive/10 border-destructive/30 animate-fade-in"
    >
      <WifiOff className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-2">
        <span className="flex-1">
          {t("connection.offline.message", "You're offline. Check your internet connection.")}
          {offlineDuration !== undefined && offlineDuration > 0 && (
            <span className="ml-2 text-xs opacity-70">
              ({formatDuration(offlineDuration)})
            </span>
          )}
        </span>
        {onRetryClick && (
          <button
            onClick={onRetryClick}
            className="inline-flex items-center gap-1 text-sm underline underline-offset-2 hover:opacity-80 transition-opacity"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t("connection.offline.retry", "Retry")}
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export default OfflineWarning;
