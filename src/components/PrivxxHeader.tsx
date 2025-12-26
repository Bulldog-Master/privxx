import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import LanguageSelector from "./LanguageSelector";
import { Button } from "./ui/button";

// Lazy load the privacy drawer - only loaded when user interacts
const PrivacyDrawer = lazy(() => import("./PrivacyDrawer"));

const PrivxxHeader = () => {
  const { t } = useTranslation("ui");

  return (
    <header className="fixed top-6 left-6 z-20 flex flex-col gap-3 opacity-70 hover:opacity-95 transition-opacity">
      <LanguageSelector />
      <Suspense fallback={<div className="min-h-[44px] w-20" />}>
        <PrivacyDrawer />
      </Suspense>
      <Link to="/whats-new">
        <Button 
          variant="ghost" 
          size="sm" 
          className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
          aria-label={t("whatsNew")}
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          {t("whatsNew")}
        </Button>
      </Link>
    </header>
  );
};

export default PrivxxHeader;
