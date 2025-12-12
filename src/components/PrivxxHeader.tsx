import PrivacyDrawer from "./PrivacyDrawer";
import LanguageSelector from "./LanguageSelector";

const PrivxxHeader = () => {
  return (
    <header className="w-full px-4 sm:px-6 py-3 flex items-center justify-end gap-1">
      <LanguageSelector />
      <PrivacyDrawer />
    </header>
  );
};

export default PrivxxHeader;
