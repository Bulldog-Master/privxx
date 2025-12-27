import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// RTL language detection
const isRtlLanguage = (lang: string): boolean => {
  return lang === 'ar' || lang === 'ur';
};

interface RtlProviderProps {
  children: React.ReactNode;
}

const RtlProvider = ({ children }: RtlProviderProps) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
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
