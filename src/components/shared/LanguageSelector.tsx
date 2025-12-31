import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// English pinned at top, rest sorted alphabetically by native name
const languages = [
  { code: 'en', label: 'English', pinned: true },
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'he', label: 'עברית' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'id', label: 'Indonesia' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
  { code: 'yi', label: 'ייִדיש' },
  { code: 'zh', label: '中文' },
];

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-transparent transition-all"
          aria-label="Select language"
        >
          <Globe className="h-5 w-5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="bg-card/95 backdrop-blur-sm border-border z-50 max-h-80 overflow-y-auto min-w-[140px]"
      >
        {languages.map(({ code, label, pinned }) => (
          <div key={code}>
            <DropdownMenuItem
              onClick={() => handleLanguageChange(code)}
              className={`cursor-pointer text-sm ${
                code === currentLanguage 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {label}
            </DropdownMenuItem>
            {pinned && <DropdownMenuSeparator className="bg-border/50 my-1" />}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
