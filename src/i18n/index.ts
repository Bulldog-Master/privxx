import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import pt from '../locales/pt/translation.json';
import fr from '../locales/fr/translation.json';
import de from '../locales/de/translation.json';
import ja from '../locales/ja/translation.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  fr: { translation: fr },
  de: { translation: de },
  ja: { translation: ja },
};

// Initialize i18next without React integration first
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'htmlTag', 'path', 'subdomain'],
      caches: [], // No caching - privacy first
    },
    react: {
      useSuspense: false, // Prevent hydration issues
    },
  });

export default i18n;
