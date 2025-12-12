import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations, getSupportedLanguages, getLanguage, setLanguage } from "@/lib/i18n";

const languageLabels: Record<string, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  pt: "PT",
  de: "DE",
};

const LanguageSelector = () => {
  const { currentLanguage } = useTranslations();
  const languages = getSupportedLanguages();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary gap-1">
          <Globe className="h-4 w-4" />
          <span>{languageLabels[currentLanguage] || "EN"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border z-50">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`cursor-pointer ${
              lang === currentLanguage 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-foreground hover:bg-secondary"
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
