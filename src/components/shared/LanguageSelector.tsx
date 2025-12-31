import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGE_META, SUPPORTED_LANGUAGE_COUNT } from "@/lib/i18n/languageConstants";

// Build languages array from shared constants, with English pinned at top
const languages: { code: string; label: string; pinned?: boolean }[] = [
  { code: 'en', label: LANGUAGE_META.en.nativeName, pinned: true },
  ...Object.entries(LANGUAGE_META)
    .filter(([code]) => code !== 'en')
    .sort((a, b) => a[1].nativeName.localeCompare(b[1].nativeName))
    .map(([code, meta]) => ({ code, label: meta.nativeName })),
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
          className="h-8 w-8 text-primary hover:text-primary/80 hover:bg-transparent transition-all relative"
          aria-label="Select language"
        >
          <Globe className="h-5 w-5" aria-hidden="true" />
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] font-bold bg-primary/20 text-primary border-0"
          >
            {SUPPORTED_LANGUAGE_COUNT}
          </Badge>
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
