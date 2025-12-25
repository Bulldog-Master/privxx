import { useState, useEffect } from 'react';

// Import translation files statically
import en from '../../public/locales/en/ui.json';
import es from '../../public/locales/es/ui.json';
import fr from '../../public/locales/fr/ui.json';
import pt from '../../public/locales/pt/ui.json';
import de from '../../public/locales/de/ui.json';
import ar from '../../public/locales/ar/ui.json';
import ru from '../../public/locales/ru/ui.json';
import bn from '../../public/locales/bn/ui.json';
import zh from '../../public/locales/zh/ui.json';
import hi from '../../public/locales/hi/ui.json';
import ur from '../../public/locales/ur/ui.json';
import id from '../../public/locales/id/ui.json';
import ja from '../../public/locales/ja/ui.json';
import nl from '../../public/locales/nl/ui.json';
import tr from '../../public/locales/tr/ui.json';
import ko from '../../public/locales/ko/ui.json';

type TranslationKey = keyof typeof en;
type Translations = Record<string, string>;

const translations: Record<string, Translations> = {
  en,
  es,
  fr,
  pt,
  de,
  ar,
  ru,
  bn,
  zh,
  hi,
  ur,
  id,
  ja,
  nl,
  tr,
  ko,
};

// Detect browser language and map to supported locale
const detectLanguage = (): string => {
  const browserLang = navigator.language || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  if (translations[langCode]) return langCode;
  return 'en'; // Default fallback
};

let currentLanguage = detectLanguage();
let listeners: Array<() => void> = [];

export const setLanguage = (lang: string) => {
  if (translations[lang]) {
    currentLanguage = lang;
    listeners.forEach(listener => listener());
  }
};

export const getLanguage = () => currentLanguage;

export const getSupportedLanguages = () => [
  'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'id', 'de', 'ja', 'nl', 'tr', 'ko'
];

// RTL language detection
export const isRtlLanguage = (lang: string): boolean => {
  return lang === 'ar' || lang === 'ur';
};

// Translation function
export const t = (key: TranslationKey): string => {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
};

// React hook for translations with reactivity
export const useTranslations = () => {
  const [lang, setLang] = useState(() => currentLanguage);
  
  useEffect(() => {
    // Sync initial state
    if (lang !== currentLanguage) {
      setLang(currentLanguage);
    }
    
    const listener = () => setLang(currentLanguage);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  // Use local lang state for translations to ensure consistency
  const translate = (key: TranslationKey): string => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };
  
  return { t: translate, currentLanguage: lang, setLanguage, getSupportedLanguages };
};
