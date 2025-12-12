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
  en: "English",
  zh: "中文",
  hi: "हिन्दी",
  es: "Español",
  fr: "Français",
  ar: "العربية",
  bn: "বাংলা",
  ru: "Русский",
  pt: "Português",
  ur: "اردو",
  id: "Indonesia",
  de: "Deutsch",
  ja: "日本語",
  nl: "Nederlands",
  tr: "Türkçe",
  ko: "한국어",
};

const LanguageSelector = () => {
  const { currentLanguage } = useTranslations();
  const languages = getSupportedLanguages();

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
        {languages.map((lang) => (
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
