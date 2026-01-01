/**
 * Password Strength Indicator Component
 * 
 * Shows visual feedback on password strength based on character complexity.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
}

type StrengthLevel = "weak" | "medium" | "strong";

interface StrengthResult {
  level: StrengthLevel;
  score: number;
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return { level: "weak", score: 0 };
  }

  let score = 0;

  // Length checks
  if (password.length >= 6) score += 1;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  // Character complexity
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;

  // Determine level
  let level: StrengthLevel;
  if (score <= 2) {
    level = "weak";
  } else if (score <= 4) {
    level = "medium";
  } else {
    level = "strong";
  }

  return { level, score };
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const { t } = useTranslation();

  const { level, score } = useMemo(() => calculateStrength(password), [password]);

  if (!password) {
    return null;
  }

  const labels: Record<StrengthLevel, string> = {
    weak: t("passwordStrength.weak", "Weak"),
    medium: t("passwordStrength.medium", "Medium"),
    strong: t("passwordStrength.strong", "Strong"),
  };

  const colors: Record<StrengthLevel, string> = {
    weak: "bg-destructive",
    medium: "bg-yellow-500",
    strong: "bg-green-500",
  };

  const textColors: Record<StrengthLevel, string> = {
    weak: "text-destructive",
    medium: "text-yellow-600 dark:text-yellow-400",
    strong: "text-green-600 dark:text-green-400",
  };

  // Calculate bar widths (3 segments)
  const filledBars = level === "weak" ? 1 : level === "medium" ? 2 : 3;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map((bar) => (
          <div
            key={bar}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-200",
              bar <= filledBars ? colors[level] : "bg-muted"
            )}
          />
        ))}
      </div>
      <p className={cn("text-xs transition-colors duration-200", textColors[level])}>
        {t("passwordStrength.label", "Password strength")}: {labels[level]}
      </p>
    </div>
  );
}
