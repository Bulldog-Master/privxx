/**
 * Password Generator Component
 * 
 * Generates a secure random password with customizable length and copies to clipboard.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wand2, Copy, Check, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface PasswordGeneratorProps {
  onGenerate: (password: string) => void;
}

function generateSecurePassword(length = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  
  const allChars = lowercase + uppercase + numbers + special;
  
  // Ensure at least one of each required type
  let password = "";
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

export function PasswordGenerator({ onGenerate }: PasswordGeneratorProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [length, setLength] = useState(16);
  const [showSettings, setShowSettings] = useState(false);

  const handleGenerate = async () => {
    const password = generateSecurePassword(length);
    setLastGenerated(password);
    onGenerate(password);
    
    // Copy to clipboard
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  };

  const handleCopyAgain = async () => {
    if (!lastGenerated) return;
    try {
      await navigator.clipboard.writeText(lastGenerated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API might not be available
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={showSettings} onOpenChange={setShowSettings}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            title={t("passwordSettings", "Password settings")}
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64" align="end">
          <div className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">{t("passwordLength", "Length")}</Label>
                <span className="text-xs font-mono text-muted-foreground">{length}</span>
              </div>
              <Slider
                value={[length]}
                onValueChange={([val]) => setLength(val)}
                min={8}
                max={32}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>8</span>
                <span>32</span>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        className="h-7 text-xs gap-1.5"
      >
        <Wand2 className="h-3 w-3" />
        {t("generatePassword", "Generate")}
      </Button>
      {lastGenerated && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopyAgain}
          className={cn(
            "h-7 w-7 p-0 transition-colors",
            copied && "text-green-500"
          )}
          title={t("copyPassword", "Copy password")}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 animate-in zoom-in-50" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </Button>
      )}
      {copied && (
        <span className="text-xs text-green-600 dark:text-green-400 animate-in fade-in slide-in-from-left-2">
          {t("passwordCopied", "Copied!")}
        </span>
      )}
    </div>
  );
}
