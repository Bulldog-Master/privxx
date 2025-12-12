import PrivacyDrawer from "./PrivacyDrawer";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/i18n";

const PrivxxHeader = () => {
  const { t } = useTranslations();
  
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-border bg-card/50">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold text-foreground">
          {t("appTitle")}
        </h1>
        <span className="text-sm text-muted-foreground">
          {t("subtitle")}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <LanguageSelector />
        <PrivacyDrawer />
      </div>
    </header>
  );
};

export default PrivxxHeader;
