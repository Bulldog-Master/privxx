import PrivacyDrawer from "./PrivacyDrawer";
import LanguagePills from "./LanguagePills";
import { useTranslations } from "@/lib/i18n";

const PrivxxHeader = () => {
  const { t } = useTranslations();
  
  return (
    <header className="w-full px-4 sm:px-6 py-3 border-b border-border bg-card/30">
      <div className="flex items-center justify-between mb-2">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-foreground">
            {t("appTitle")}
          </h1>
          <span className="text-xs text-muted-foreground">
            {t("subtitle")}
          </span>
        </div>
        
        <PrivacyDrawer />
      </div>
      
      <LanguagePills />
    </header>
  );
};

export default PrivxxHeader;
