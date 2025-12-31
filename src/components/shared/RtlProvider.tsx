import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// RTL language detection (Arabic, Urdu, Hebrew, Yiddish)
const isRtlLanguage = (lang: string): boolean => {
  return lang === 'ar' || lang === 'ur' || lang === 'he' || lang === 'yi';
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
