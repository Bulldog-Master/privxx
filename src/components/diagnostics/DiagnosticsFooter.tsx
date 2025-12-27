import { useTranslation } from "react-i18next";
import { RefreshCw, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildInfo } from "@/lib/buildInfo";

interface DiagnosticsFooterProps {
  isLoading: boolean;
  copied: boolean;
  onRefresh: () => void;
  onCopy: () => void;
}

const DiagnosticsFooter = ({
  isLoading,
  copied,
  onRefresh,
  onCopy,
}: DiagnosticsFooterProps) => {
  const { t } = useTranslation();

  const versionLabel = `Privxx v${buildInfo.version}${buildInfo.build ? ` (${buildInfo.build})` : ""}`;

  return (
    <div className="pt-2 border-t border-border flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        {versionLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={onRefresh}
          disabled={isLoading}
          aria-label={t("diagnosticsRefresh")}
        >
          <RefreshCw 
            className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} 
            aria-hidden="true" 
          />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={onCopy}
          aria-label={t("diagnosticsCopy")}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default DiagnosticsFooter;
