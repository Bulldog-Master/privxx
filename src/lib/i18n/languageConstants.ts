/**
 * Shared language metadata constants for i18n support.
 * Single source of truth for supported languages across the application.
 */

export interface LanguageMeta {
  name: string;
  nativeName: string;
  rtl?: boolean;
}

export const LANGUAGE_META: Record<string, LanguageMeta> = {
  en: { name: 'English', nativeName: 'English' },
  ar: { name: 'Arabic', nativeName: 'العربية', rtl: true },
  bn: { name: 'Bengali', nativeName: 'বাংলা' },
  de: { name: 'German', nativeName: 'Deutsch' },
  es: { name: 'Spanish', nativeName: 'Español' },
  fr: { name: 'French', nativeName: 'Français' },
  he: { name: 'Hebrew', nativeName: 'עברית', rtl: true },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  it: { name: 'Italian', nativeName: 'Italiano' },
  ja: { name: 'Japanese', nativeName: '日本語' },
  ko: { name: 'Korean', nativeName: '한국어' },
  nl: { name: 'Dutch', nativeName: 'Nederlands' },
  pl: { name: 'Polish', nativeName: 'Polski' },
  pt: { name: 'Portuguese', nativeName: 'Português' },
  ru: { name: 'Russian', nativeName: 'Русский' },
  tr: { name: 'Turkish', nativeName: 'Türkçe' },
  ur: { name: 'Urdu', nativeName: 'اردو', rtl: true },
  yi: { name: 'Yiddish', nativeName: 'ייִדיש', rtl: true },
  zh: { name: 'Chinese', nativeName: '中文' },
};

export const SUPPORTED_LANGUAGE_CODES = Object.keys(LANGUAGE_META);
export const SUPPORTED_LANGUAGE_COUNT = SUPPORTED_LANGUAGE_CODES.length;
export const RTL_LANGUAGES = SUPPORTED_LANGUAGE_CODES.filter(code => LANGUAGE_META[code].rtl);
