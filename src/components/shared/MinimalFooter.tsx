import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/**
 * Minimal footer with only essential legal links.
 * All system/diagnostics info is moved behind StatusPill.
 */
const MinimalFooter = () => {
  const { t } = useTranslation();
  
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
    </div>
  );
};

export default MinimalFooter;
