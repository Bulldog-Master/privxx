import { useTranslation } from "react-i18next";

const languageLabels: Record<string, string> = {
  en: "EN",
  zh: "中",
  hi: "हि",
  es: "ES",
  fr: "FR",
  ar: "ع",
  bn: "বা",
  ru: "RU",
  pt: "PT",
  ur: "اُ",
  id: "ID",
  de: "DE",
  ja: "日",
  nl: "NL",
  tr: "TR",
  ko: "한",
  he: "עב",
  yi: "יי",
};

const supportedLanguages = [
  'en', 'zh', 'hi', 'es', 'fr', 'ar', 'bn', 'ru', 'pt', 'ur', 'id', 'de', 'ja', 'nl', 'tr', 'ko', 'he', 'yi'
];

const LanguagePills = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide py-0.5 max-w-full">
      {supportedLanguages.map((lang) => (
        <button
          key={lang}
          onClick={() => i18n.changeLanguage(lang)}
          aria-label={`Switch language to ${lang.toUpperCase()}`}
          className={`
            px-1.5 py-0.5 text-[10px] font-medium rounded transition-all duration-200
            whitespace-nowrap flex-shrink-0
            ${lang === currentLanguage
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground/70 hover:bg-muted/50 hover:text-muted-foreground"
            }
          `}
        >
          {languageLabels[lang]}
        </button>
      ))}
    </div>
  );
};

export default LanguagePills;
