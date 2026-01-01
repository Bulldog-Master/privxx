/**
 * Translation Status Widget
 * 
 * Compact translation coverage indicator for Settings page.
 */

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Languages, ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SUPPORTED_LANGUAGE_CODES } from "@/lib/i18n/languageConstants";

interface LanguageStatus {
  code: string;
  keyCount: number;
  isComplete: boolean;
}

export function TranslationStatusWidget() {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<{
    total: number;
    complete: number;
    languages: LanguageStatus[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const analyzeTranslations = async () => {
      try {
        // Fetch English as reference
        const enResponse = await fetch("/locales/en/ui.json");
        if (!enResponse.ok) return;
        const enData = await enResponse.json();
        
        const getAllKeys = (obj: Record<string, unknown>, prefix = ""): string[] => {
          const keys: string[] = [];
          for (const key of Object.keys(obj)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (typeof obj[key] === "object" && obj[key] !== null) {
              keys.push(...getAllKeys(obj[key] as Record<string, unknown>, fullKey));
            } else {
              keys.push(fullKey);
            }
          }
          return keys;
        };
        
        const enKeys = getAllKeys(enData);
        const enKeyCount = enKeys.length;
        
        const results: LanguageStatus[] = [];
        
        for (const code of SUPPORTED_LANGUAGE_CODES) {
          try {
            const response = await fetch(`/locales/${code}/ui.json`);
            if (!response.ok) {
              results.push({ code, keyCount: 0, isComplete: false });
              continue;
            }
            const data = await response.json();
            const keys = getAllKeys(data);
            results.push({
              code,
              keyCount: keys.length,
              isComplete: keys.length >= enKeyCount,
            });
          } catch {
            results.push({ code, keyCount: 0, isComplete: false });
          }
        }
        
        const complete = results.filter((r) => r.isComplete).length;
        
        setStatus({
          total: SUPPORTED_LANGUAGE_CODES.length,
          complete,
          languages: results,
        });
      } catch (error) {
        console.error("Failed to analyze translations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    analyzeTranslations();
  }, []);

  const currentLang = SUPPORTED_LANGUAGE_CODES.includes(i18n.language)
    ? i18n.language
    : "en";
  const currentStatus = status?.languages.find((l) => l.code === currentLang);
  const percentage = status ? Math.round((status.complete / status.total) * 100) : 0;
  const isAllComplete = status?.complete === status?.total;

  return (
    <Card className="bg-card/90 backdrop-blur-sm border-border/50">
      <Link to="/diagnostics" className="block">
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Languages className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-primary">
                  {t("settings.translations", "Translation Status")}
                </p>
                {!isLoading && (
                  <Badge
                    variant={isAllComplete ? "default" : "secondary"}
                    className={isAllComplete ? "bg-green-500/20 text-green-600" : ""}
                  >
                    {isAllComplete ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {status?.complete}/{status?.total}
                  </Badge>
                )}
              </div>
              <div className="mt-1.5">
                {isLoading ? (
                  <div className="h-1.5 bg-muted rounded-full animate-pulse" />
                ) : (
                  <Progress value={percentage} className="h-1.5" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isLoading
                  ? t("diagnostics.analyzing", "Analyzing translations...")
                  : t("settings.translationsDesc", "{{count}} languages synced", {
                      count: status?.complete || 0,
                    })}
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-primary/70 flex-shrink-0" />
        </CardContent>
      </Link>
    </Card>
  );
}
