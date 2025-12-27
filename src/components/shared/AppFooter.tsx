import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const AppFooter = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="mt-auto border-t border-border/50">
      <div className="mx-auto max-w-3xl px-4 py-4 text-sm text-primary/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>{t("footerTagline")}</span>
        <div className="flex items-center gap-4">
          <Link 
            className="hover:text-primary transition-colors underline underline-offset-4" 
            to="/privacy"
          >
            {t("privacyPolicyTitle")}
          </Link>
          <Link 
            className="hover:text-primary transition-colors underline underline-offset-4" 
            to="/terms"
          >
            {t("termsTitle")}
          </Link>
          <Link 
            className="hover:text-primary transition-colors underline underline-offset-4" 
            to="/whats-new"
          >
            {t("whatsNew")}
          </Link>
          <Link 
            className="hover:text-primary transition-colors underline underline-offset-4" 
            to="/docs"
          >
            {t("componentDocs", "Docs")}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default AppFooter;
