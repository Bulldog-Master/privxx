import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Globe, Check, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { buildInfo } from '@/lib/buildInfo';

interface LanguageCoverage {
  code: string;
  name: string;
  completionPercent: number;
  isComplete: boolean;
}

const LANGUAGE_META: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  bn: 'Bengali',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  he: 'Hebrew',
  hi: 'Hindi',
  id: 'Indonesian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  pt: 'Portuguese',
  ru: 'Russian',
  tr: 'Turkish',
  ur: 'Urdu',
  yi: 'Yiddish',
  zh: 'Chinese',
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_META);
const CACHE_KEY = `privxx_coverage_badge_${buildInfo.build || buildInfo.version}`;
const CACHE_TTL_MS = 5 * 60 * 1000;

function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null) {
      keys.push(...getAllKeys(value as Record<string, unknown>, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

interface CachedCoverage {
  languages: LanguageCoverage[];
  overallPercent: number;
  timestamp: number;
}

function getCached(): CachedCoverage | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const data: CachedCoverage = JSON.parse(cached);
    if (Date.now() - data.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCache(data: Omit<CachedCoverage, 'timestamp'>): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
  } catch {
    // ignore
  }
}

export function TranslationCoverageBadge() {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<LanguageCoverage[]>([]);
  const [overallPercent, setOverallPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);

  const analyze = useCallback(async () => {
    const cached = getCached();
    if (cached) {
      setLanguages(cached.languages);
      setOverallPercent(cached.overallPercent);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const cacheBuster = `${Date.now()}`;
      const enRes = await fetch(`/locales/en/ui.json?v=${cacheBuster}`);
      if (!enRes.ok) throw new Error('Failed to load English');
      const enData = await enRes.json();
      const refKeys = getAllKeys(enData);

      const results: LanguageCoverage[] = await Promise.all(
        SUPPORTED_LANGUAGES.map(async (code) => {
          try {
            const res = await fetch(`/locales/${code}/ui.json?v=${cacheBuster}`);
            if (!res.ok) {
              return { code, name: LANGUAGE_META[code], completionPercent: 0, isComplete: false };
            }
            const data = await res.json();
            const keys = getAllKeys(data);
            const missing = refKeys.filter((k) => !keys.includes(k)).length;
            const percent = refKeys.length > 0 ? Math.round(((refKeys.length - missing) / refKeys.length) * 100) : 100;
            return { code, name: LANGUAGE_META[code], completionPercent: percent, isComplete: missing === 0 };
          } catch {
            return { code, name: LANGUAGE_META[code], completionPercent: 0, isComplete: false };
          }
        })
      );

      const avgPercent = results.length > 0
        ? Math.round(results.reduce((sum, l) => sum + l.completionPercent, 0) / results.length)
        : 0;

      setLanguages(results);
      setOverallPercent(avgPercent);
      setCache({ languages: results, overallPercent: avgPercent });
    } catch {
      setOverallPercent(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      analyze();
    }
  }, [analyze]);

  const completeCount = languages.filter((l) => l.isComplete).length;
  const totalCount = languages.length;
  const allComplete = completeCount === totalCount && totalCount > 0;

  if (loading) {
    return (
      <Badge variant="outline" className="gap-1.5 animate-pulse">
        <Globe className="h-3.5 w-3.5" />
        <span className="text-xs">...</span>
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={allComplete ? 'default' : 'secondary'}
            className={`gap-1.5 cursor-help ${
              allComplete
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
            }`}
          >
            {allComplete ? (
              <Check className="h-3.5 w-3.5" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5" />
            )}
            <span className="text-xs font-medium">
              {t('diagnostics.i18nCoverage', 'i18n')}: {overallPercent}%
            </span>
            <span className="text-xs opacity-70">
              ({completeCount}/{totalCount})
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium text-sm">
              {t('diagnostics.translationCoverage', 'Translation Coverage')}
            </p>
            <div className="grid grid-cols-4 gap-1 text-xs">
              {languages.map((lang) => (
                <div
                  key={lang.code}
                  className={`px-1.5 py-0.5 rounded text-center ${
                    lang.isComplete
                      ? 'bg-emerald-500/20 text-emerald-600'
                      : 'bg-amber-500/20 text-amber-600'
                  }`}
                >
                  <span className="uppercase font-mono">{lang.code}</span>
                  <span className="ml-1">{lang.completionPercent}%</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {allComplete
                ? t('diagnostics.allLanguagesComplete', 'All languages fully synced')
                : t('diagnostics.someLanguagesIncomplete', 'Some languages need sync')}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
