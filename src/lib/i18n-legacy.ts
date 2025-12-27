/**
 * i18n Legacy Utilities
 * 
 * Static language detection and RTL support functions.
 * These are kept separate from the react-i18next wrapper.
 */

import i18n from 'i18next';

// Detect browser language and map to supported locale
export const detectLanguage = (): string => {
  const browserLang = navigator.language || 'en';
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  const supportedLangs = ['en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'id', 'de', 'ja', 'nl', 'tr', 'ko'];
  if (supportedLangs.includes(langCode)) return langCode;
  return 'en'; // Default fallback
};

export const setLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
};

export const getLanguage = () => i18n.language || detectLanguage();

export const getSupportedLanguages = () => [
  'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'id', 'de', 'ja', 'nl', 'tr', 'ko'
];

// RTL language detection
export const isRtlLanguage = (lang: string): boolean => {
  return lang === 'ar' || lang === 'ur';
};
