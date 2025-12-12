import PrivacyDrawer from "./PrivacyDrawer";
import LanguageSelector from "./LanguageSelector";
import { useTranslations } from "@/lib/i18n";

const PrivxxHeader = () => {
  const { t } = useTranslations();
  
  return (
    <header className="w-full px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <LanguageSelector />
      </div>
      
      <PrivacyDrawer />
    </header>
  );
};

export default PrivxxHeader;
