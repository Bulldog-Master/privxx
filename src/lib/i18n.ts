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

export const getSupportedLanguages = () => ['en', 'es', 'fr', 'pt', 'de', 'ar', 'ru', 'bn', 'zh'];

// Translation function
export const t = (key: TranslationKey): string => {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
};

// React hook for translations with reactivity
export const useTranslations = () => {
  const [, setTick] = useState(0);
  
  useEffect(() => {
    const listener = () => setTick(tick => tick + 1);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  return { t, currentLanguage, setLanguage, getSupportedLanguages };
};
