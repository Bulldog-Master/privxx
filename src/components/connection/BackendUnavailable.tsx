import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { WifiOff } from "lucide-react";

interface BackendUnavailableProps {
  onRetry: () => void;
}

/**
 * BackendUnavailable - Graceful degradation screen
 * 
 * Shown when backend is unreachable.
 * Provides retry and continue-in-preview options.
 */
export default function BackendUnavailable({ onRetry }: BackendUnavailableProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4">
            <WifiOff className="h-8 w-8 text-primary/60" aria-hidden="true" />
          </div>
        </div>
        
        <h2 className="text-lg font-semibold text-primary">
          {t("offlineTitle")}
        </h2>
        
        <p className="text-sm text-primary/60">
          {t("offlineBody")}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
          <Button 
            className="min-h-[44px]" 
            onClick={onRetry}
          >
            {t("retry")}
          </Button>
          <Button
            variant="outline"
            className="min-h-[44px]"
            onClick={() => window.location.reload()}
          >
            {t("continuePreview")}
          </Button>
        </div>
      </div>
    </div>
  );
}
