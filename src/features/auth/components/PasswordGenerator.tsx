/**
 * Password Generator Component
 * 
 * Generates a secure random password and copies it to clipboard.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Wand2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleGenerate = async () => {
    const password = generateSecurePassword(16);
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
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        className="h-7 text-xs gap-1.5"
      >
        <Wand2 className="h-3 w-3" />
        {t("generatePassword", "Generate strong password")}
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
