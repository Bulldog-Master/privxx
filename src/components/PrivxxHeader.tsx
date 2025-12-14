import PrivacyDrawer from "./PrivacyDrawer";
import LanguageSelector from "./LanguageSelector";

const PrivxxHeader = () => {
  return (
    <header className="fixed top-4 left-4 z-20 flex flex-col gap-2">
      <LanguageSelector />
      <PrivacyDrawer />
    </header>
  );
};

export default PrivxxHeader;
