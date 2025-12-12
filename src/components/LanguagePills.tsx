import { useTranslations, setLanguage, getSupportedLanguages } from "@/lib/i18n";

const languageLabels: Record<string, string> = {
  en: "EN",
  zh: "中文",
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
};

const LanguagePills = () => {
  const { currentLanguage } = useTranslations();
  const languages = getSupportedLanguages();

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-1 max-w-full">
      {languages.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          aria-label={`Switch language to ${lang.toUpperCase()}`}
          className={`
            px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200
            whitespace-nowrap flex-shrink-0
            ${lang === currentLanguage
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
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
