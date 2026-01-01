import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { buildInfo } from "@/lib/buildInfo";

/**
 * Minimal footer with only essential legal links and version info.
 * All system/diagnostics info is moved behind StatusPill.
 */
const MinimalFooter = () => {
  const { t } = useTranslation();
  
  const versionDisplay = buildInfo.build 
    ? `v${buildInfo.version}+${buildInfo.build.slice(0, 7)}`
    : `v${buildInfo.version}`;
  
  return (
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
      <span 
        className="font-mono opacity-70"
        title={t("appVersion", "App version")}
      >
        {versionDisplay}
      </span>
    </div>
  );
};

export default MinimalFooter;
