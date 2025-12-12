import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations, getSupportedLanguages, setLanguage } from "@/lib/i18n";

const languageLabels: Record<string, string> = {
  ar: "العربية",
  bn: "বাংলা",
  de: "Deutsch",
  en: "English",
  es: "Español",
  fr: "Français",
  hi: "हिन्दी",
  id: "Indonesia",
  ja: "日本語",
  ko: "한국어",
  nl: "Nederlands",
  pt: "Português",
  ru: "Русский",
  tr: "Türkçe",
  ur: "اردو",
  zh: "中文",
};

// Alphabetical order by English name
const sortedLanguages = ['ar', 'bn', 'zh', 'nl', 'en', 'fr', 'de', 'hi', 'id', 'ja', 'ko', 'pt', 'ru', 'es', 'tr', 'ur'];

const LanguageSelector = () => {
  const { currentLanguage } = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:text-foreground hover:bg-muted/50"
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-card border-border z-50 max-h-80 overflow-y-auto min-w-[140px]"
      >
        {sortedLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer text-sm ${
              lang === currentLanguage 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-foreground hover:bg-muted/50"
            }`}
          >
            {languageLabels[lang]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
