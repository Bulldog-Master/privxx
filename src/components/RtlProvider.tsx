import { useEffect } from "react";
import { useTranslations, isRtlLanguage } from "@/lib/i18n";

interface RtlProviderProps {
  children: React.ReactNode;
}

const RtlProvider = ({ children }: RtlProviderProps) => {
  const { currentLanguage } = useTranslations();
  const isRtl = isRtlLanguage(currentLanguage);

  useEffect(() => {
    // Update document direction and language
    document.documentElement.dir = isRtl ? "rtl" : "ltr";
    document.documentElement.lang = currentLanguage;
  }, [currentLanguage, isRtl]);

  return (
    <div dir={isRtl ? "rtl" : "ltr"} lang={currentLanguage}>
      {children}
    </div>
  );
};

export default RtlProvider;
