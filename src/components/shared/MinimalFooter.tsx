import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildInfo } from "@/lib/buildInfo";
import { isMockMode } from "@/api/bridge";
import { Info } from "lucide-react";

/**
 * Minimal footer with only essential legal links and version info.
 * All system/diagnostics info is moved behind StatusPill.
 */
const MinimalFooter = () => {
  const { t } = useTranslation();
  
  const versionDisplay = `v${buildInfo.version}`;
  const isDemo = isMockMode();
  
  return (
    <div className="flex flex-col items-center gap-2">
      {/* Demo Mode Indicator */}
      {isDemo && (
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-foreground text-xs">
          <Info className="h-3 w-3 text-primary" />
          <span>{t("demoMode.label", "Preview Mode")}</span>
          <span className="text-foreground/60">—</span>
          <span className="text-foreground/80">{t("demoMode.simulated", "routing simulated")}</span>
        </div>
      )}

      {/* Links */}
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground/60">
        <Link 
          to="/privacy" 
          className="hover:text-foreground/80 transition-colors"
        >
          {t("privacyPolicyLink", "Privacy")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link 
          to="/terms" 
          className="hover:text-foreground/80 transition-colors"
        >
          {t("termsTitle", "Terms")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link 
          to="/whats-new" 
          className="hover:text-foreground/80 transition-colors"
        >
          {t("whatsNew", "What's New")}
        </Link>
        <span aria-hidden="true">·</span>
        <Link 
          to="/about"
          className="font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary/80 hover:bg-primary/20 transition-colors"
          title={t("appVersion", "App version")}
        >
          {versionDisplay}
        </Link>
      </div>
    </div>
  );
};

export default MinimalFooter;
