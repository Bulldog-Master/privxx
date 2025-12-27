/**
 * i18n Compatibility Layer
 * 
 * DEPRECATED: This wrapper provides backward compatibility during migration.
 * New code should use `useTranslation` from react-i18next directly.
 * 
 * This wrapper will be removed once all components are migrated.
 */

import { useTranslation } from 'react-i18next';

// Re-export language utilities that are still needed
export { setLanguage, getLanguage, getSupportedLanguages, isRtlLanguage } from './i18n-legacy';

// Wrapper hook that provides same interface using react-i18next
export function useTranslations(ns?: string) {
  const { t, i18n } = useTranslation(ns);
  
  return { 
    t: (key: string) => t(key) as string,
    currentLanguage: i18n.language,
    setLanguage: (lang: string) => i18n.changeLanguage(lang),
    getSupportedLanguages: () => [
      'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'id', 'de', 'ja', 'nl', 'tr', 'ko'
    ],
  };
}
