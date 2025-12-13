import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations, setLanguage } from "@/lib/i18n";

// English pinned at top, rest sorted alphabetically by native name
const languages = [
  { code: 'en', label: 'English', pinned: true },
  { code: 'ar', label: 'العربية' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'id', label: 'Indonesia' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'ur', label: 'اردو' },
  { code: 'zh', label: '中文' },
];

const LanguageSelector = () => {
  const { currentLanguage } = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 text-primary hover:text-white bg-primary/10 hover:bg-primary rounded-full transition-all duration-200"
          aria-label="Select language"
        >
          <Globe className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-card border-border z-50 max-h-80 overflow-y-auto min-w-[140px]"
      >
        {languages.map(({ code, label, pinned }) => (
          <div key={code}>
            <DropdownMenuItem
              onClick={() => setLanguage(code)}
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
