import PrivacyDrawer from "./PrivacyDrawer";
import LanguageSelector from "./LanguageSelector";

const PrivxxHeader = () => {
  return (
    <header className="fixed top-6 left-6 z-20 flex flex-col gap-3 opacity-70 hover:opacity-95 transition-opacity">
      <LanguageSelector />
      <PrivacyDrawer />
    </header>
  );
};

export default PrivxxHeader;
