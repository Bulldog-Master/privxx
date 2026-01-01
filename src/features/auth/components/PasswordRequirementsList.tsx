/**
 * Password Requirements List Component
 * 
 * Shows animated checkmarks as password requirements are fulfilled in real-time.
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirementsListProps {
  password: string;
}

interface Requirement {
  key: string;
  label: string;
  test: (password: string) => boolean;
}

export function PasswordRequirementsList({ password }: PasswordRequirementsListProps) {
  const { t } = useTranslation();

  const requirements: Requirement[] = useMemo(() => [
    {
      key: "length",
      label: t("passwordRequirements.length", "At least 8 characters"),
      test: (p) => p.length >= 8,
    },
    {
      key: "uppercase",
      label: t("passwordRequirements.uppercase", "Uppercase letter (A-Z)"),
      test: (p) => /[A-Z]/.test(p),
    },
    {
      key: "lowercase",
      label: t("passwordRequirements.lowercase", "Lowercase letter (a-z)"),
      test: (p) => /[a-z]/.test(p),
    },
    {
      key: "number",
      label: t("passwordRequirements.number", "Number (0-9)"),
      test: (p) => /[0-9]/.test(p),
    },
    {
      key: "special",
      label: t("passwordRequirements.special", "Special character (!@#$%)"),
      test: (p) => /[^a-zA-Z0-9]/.test(p),
    },
  ], [t]);

  if (!password) {
    return null;
  }

  return (
    <ul className="space-y-1 text-xs">
      {requirements.map((req) => {
        const isMet = req.test(password);
        return (
          <li
            key={req.key}
            className={cn(
              "flex items-center gap-2 transition-all duration-300",
              isMet ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full transition-all duration-300",
                isMet
                  ? "bg-green-500/20 scale-100"
                  : "bg-muted scale-90"
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3 animate-in zoom-in-50 duration-200" />
              ) : (
                <X className="h-3 w-3 opacity-50" />
              )}
            </span>
            <span className={cn(
              "transition-all duration-300",
              isMet && "line-through opacity-70"
            )}>
              {req.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
