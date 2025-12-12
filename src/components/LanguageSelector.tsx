import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations, getSupportedLanguages, setLanguage } from "@/lib/i18n";

// Sorted alphabetically by English name
const languages = [
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'zh', label: '中文' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'id', label: 'Indonesia' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'es', label: 'Español' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
];

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
        {languages.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code)}
            className={`cursor-pointer text-sm ${
              code === currentLanguage 
                ? "bg-primary/10 text-primary font-medium" 
                : "text-foreground hover:bg-muted/50"
            }`}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
