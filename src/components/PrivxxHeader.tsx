import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Sparkles, Settings, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSelector from "./LanguageSelector";
import { IdentityStatusCompact } from "./IdentityStatusCompact";
import { Button } from "./ui/button";

// Lazy load the privacy drawer - only loaded when user interacts
const PrivacyDrawer = lazy(() => import("./PrivacyDrawer"));

const PrivxxHeader = () => {
  const { t } = useTranslation("ui");
  const { isAuthenticated } = useAuth();

  return (
    <header className="fixed top-6 left-6 z-20 flex flex-col gap-3 opacity-70 hover:opacity-95 transition-opacity">
      <LanguageSelector />
      <Suspense fallback={<div className="min-h-[44px] w-20" />}>
        <PrivacyDrawer />
      </Suspense>
      {isAuthenticated ? (
        <>
          <IdentityStatusCompact />
          <Link to="/settings">
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
              aria-label={t("settings", "Settings")}
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{t("settings", "Settings")}</span>
            </Button>
          </Link>
        </>
      ) : (
        <Link to="/auth">
          <Button 
            variant="ghost" 
            size="sm" 
            className="justify-start gap-2 text-foreground/70 hover:text-foreground min-h-[44px]"
            aria-label={t("signIn", "Sign In")}
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">{t("signIn", "Sign In")}</span>
          </Button>
        </Link>
      )}
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
