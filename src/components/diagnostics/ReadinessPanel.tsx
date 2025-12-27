import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { checkReadiness, type ReadinessResult } from "@/lib/readiness";

/**
 * ReadinessPanel - Read-only section for cutover verification
 * 
 * Displays bridge/backend readiness state for diagnostics.
 * Must remain unobtrusive and placed under Diagnostics only.
 */
export default function ReadinessPanel() {
  const { t } = useTranslation();
  const [data, setData] = useState<ReadinessResult | null>(null);

  useEffect(() => {
    checkReadiness().then(setData);
  }, []);

  if (!data) return null;

  return (
    <section 
      className="space-y-1 text-sm text-muted-foreground border-t border-border/50 pt-3 mt-3"
      aria-label="Readiness status"
    >
      <div className="text-xs font-medium text-foreground/70 mb-2">
        {t("readinessTitle", "Readiness")}
      </div>
      <div className="flex justify-between">
        <span>{t("readinessBridge", "Bridge reachable")}</span>
        <span className={data.bridgeReachable ? "text-green-500" : "text-muted-foreground"}>
          {data.bridgeReachable ? t("yes", "Yes") : t("no", "No")}
        </span>
      </div>
      <div className="flex justify-between">
        <span>{t("readinessBackend", "Backend ready")}</span>
        <span className={data.backendReady ? "text-green-500" : "text-muted-foreground"}>
          {data.backendReady ? t("yes", "Yes") : t("no", "No")}
        </span>
      </div>
      <div className="flex justify-between">
        <span>{t("readinessMode", "Mode")}</span>
        <span>{data.mockMode ? t("previewModeLabel") : t("liveModeLabel")}</span>
      </div>
    </section>
  );
}
