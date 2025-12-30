import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { countPlaceholdersInObject } from "@/lib/i18nPlaceholders";

/**
 * Shows a non-tracking reminder if the current language contains placeholder strings.
 * Uses sessionStorage only (privacy rule). Only shows in development mode.
 */
export function TranslationPlaceholderToast() {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const [alreadyShown, setAlreadyShown] = useState(false);

  const placeholderCount = useMemo(() => {
    try {
      // Access i18next's resource store for current language
      const resources = i18n.store?.data?.[locale]?.ui;
      return countPlaceholdersInObject(resources);
    } catch {
      return 0;
    }
  }, [i18n.store?.data, locale]);

  useEffect(() => {
    // Only show in development mode
    if (import.meta.env.PROD) return;

    // Don't spam; show once per session per locale
    const key = `i18n-placeholder-toast:${locale}`;
    try {
      if (sessionStorage.getItem(key) === "true") {
        setAlreadyShown(true);
        return;
      }
    } catch {
      // ignore storage errors
    }

    if (!alreadyShown && placeholderCount > 0) {
      toast.warning("Translations incomplete", {
        description: `${placeholderCount} placeholder strings detected for "${locale}". Run: node scripts/check-language.js --fix`,
        duration: 8000,
      });
      try {
        sessionStorage.setItem(key, "true");
      } catch {
        // ignore storage errors
      }
      setAlreadyShown(true);
    }
  }, [alreadyShown, locale, placeholderCount]);

  return null;
}
