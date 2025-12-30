import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, AlertTriangle, Globe, RefreshCw, Clock, XCircle, AlertOctagon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDistanceToNow } from 'date-fns';
import { buildInfo } from '@/lib/buildInfo';

interface LanguageStatus {
  code: string;
  name: string;
  nativeName: string;
  totalKeys: number;
  placeholderKeys: string[];
  missingKeys: string[];
  completionPercent: number;
  qualityPercent: number; // Separate metric: % of keys that are NOT placeholders
  isComplete: boolean;
  isValid: boolean; // New: tracks JSON parse success
  parseError?: string; // New: stores parse error message
}

interface CachedData {
  statuses: LanguageStatus[];
  timestamp: number;
}

const LANGUAGE_META: Record<string, { name: string; nativeName: string }> = {
  en: { name: 'English', nativeName: 'English' },
  ar: { name: 'Arabic', nativeName: 'العربية' },
  bn: { name: 'Bengali', nativeName: 'বাংলা' },
  de: { name: 'German', nativeName: 'Deutsch' },
  es: { name: 'Spanish', nativeName: 'Español' },
  fr: { name: 'French', nativeName: 'Français' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी' },
  id: { name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  ja: { name: 'Japanese', nativeName: '日本語' },
  ko: { name: 'Korean', nativeName: '한국어' },
  nl: { name: 'Dutch', nativeName: 'Nederlands' },
  pt: { name: 'Portuguese', nativeName: 'Português' },
  ru: { name: 'Russian', nativeName: 'Русский' },
  tr: { name: 'Turkish', nativeName: 'Türkçe' },
  ur: { name: 'Urdu', nativeName: 'اردو' },
  zh: { name: 'Chinese', nativeName: '中文' },
};

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_META);
const CACHE_KEY = `privxx_translation_status_cache_${buildInfo.build || buildInfo.version}`;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

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
  return keys.sort();
}

function isPlaceholder(value: string, langCode: string): boolean {
  const prefix = `[${langCode.toUpperCase()}]`;
  return typeof value === 'string' && value.startsWith(prefix);
}

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return current;
}

function getCachedData(): CachedData | null {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const data: CachedData = JSON.parse(cached);
    const age = Date.now() - data.timestamp;
    
    if (age > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

function setCachedData(statuses: LanguageStatus[]): void {
  try {
    const data: CachedData = {
      statuses,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors
  }
}

export function TranslationStatusDashboard() {
  const { t, i18n } = useTranslation();
  const [statuses, setStatuses] = useState<LanguageStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLang, setExpandedLang] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const initialLoadDone = useRef(false);

  const analyzeTranslations = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedData();
      if (cached) {
        setStatuses(cached.statuses);
        setLastUpdated(new Date(cached.timestamp));
        setLoading(false);
        return;
      }
    } else {
      // Force-refresh should always bypass any stored results
      try {
        sessionStorage.removeItem(CACHE_KEY);
      } catch {
        // ignore
      }
    }

    setLoading(true);
    setError(null);

    try {
      const cacheBuster = `${Date.now()}`;
      const fetchOptions: RequestInit | undefined = forceRefresh ? { cache: 'no-store' } : undefined;

      // Fetch English as reference
      const enResponse = await fetch(`/locales/en/ui.json?v=${cacheBuster}`, fetchOptions);
      if (!enResponse.ok) throw new Error('Failed to load English reference');
      const enData = await enResponse.json();
      const referenceKeys = getAllKeys(enData);

      const results: LanguageStatus[] = [];

      // Fetch all languages in parallel for better performance
      const fetchPromises = SUPPORTED_LANGUAGES.map(async (langCode) => {
        try {
          const response = await fetch(`/locales/${langCode}/ui.json?v=${cacheBuster}`, fetchOptions);
          if (!response.ok) {
            return {
              code: langCode,
              name: LANGUAGE_META[langCode].name,
              nativeName: LANGUAGE_META[langCode].nativeName,
              totalKeys: 0,
              placeholderKeys: [] as string[],
              missingKeys: referenceKeys,
              completionPercent: 0,
              qualityPercent: 0,
              isComplete: false,
              isValid: false,
              parseError: `HTTP ${response.status}: Failed to fetch`,
            };
          }

          // Try to parse JSON - detect invalid JSON
          const responseText = await response.text();
          let langData: Record<string, unknown>;
          try {
            langData = JSON.parse(responseText);
          } catch (parseErr) {
            // Dev-only: log the parse error
            if (import.meta.env.DEV) {
              console.error(`[i18n] Invalid JSON in ${langCode}/ui.json:`, parseErr);
            }
            return {
              code: langCode,
              name: LANGUAGE_META[langCode].name,
              nativeName: LANGUAGE_META[langCode].nativeName,
              totalKeys: 0,
              placeholderKeys: [] as string[],
              missingKeys: referenceKeys,
              completionPercent: 0,
              qualityPercent: 0,
              isComplete: false,
              isValid: false,
              parseError: parseErr instanceof Error ? parseErr.message : 'Invalid JSON',
            };
          }

          const langKeys = getAllKeys(langData);

          const missingKeys = referenceKeys.filter((k) => !langKeys.includes(k));
          const placeholderKeys: string[] = [];

          // Count placeholder values
          for (const key of langKeys) {
            const value = getValueAtPath(langData, key);
            if (typeof value === 'string' && isPlaceholder(value, langCode)) {
              placeholderKeys.push(key);
            }
          }

          // Completion % = keys present (regardless of placeholder status)
          const completionPercent = referenceKeys.length > 0
            ? Math.round(((referenceKeys.length - missingKeys.length) / referenceKeys.length) * 100)
            : 100;

          // Quality % = keys that are NOT placeholders (actual translations)
          const translatedKeys = langKeys.length - placeholderKeys.length;
          const qualityPercent = referenceKeys.length > 0
            ? Math.round((translatedKeys / referenceKeys.length) * 100)
            : 100;

          return {
            code: langCode,
            name: LANGUAGE_META[langCode].name,
            nativeName: LANGUAGE_META[langCode].nativeName,
            totalKeys: langKeys.length,
            placeholderKeys,
            missingKeys,
            completionPercent: Math.max(0, completionPercent),
            qualityPercent: Math.max(0, qualityPercent),
            isComplete: missingKeys.length === 0,
            isValid: true,
          };
        } catch (err) {
          return {
            code: langCode,
            name: LANGUAGE_META[langCode].name,
            nativeName: LANGUAGE_META[langCode].nativeName,
            totalKeys: 0,
            placeholderKeys: [] as string[],
            missingKeys: referenceKeys,
            completionPercent: 0,
            qualityPercent: 0,
            isComplete: false,
            isValid: false,
            parseError: err instanceof Error ? err.message : 'Unknown error',
          };
        }
      });

      const fetchedResults = await Promise.all(fetchPromises);
      results.push(...fetchedResults);

      // Sort: invalid first, then incomplete, then by completion percent
      results.sort((a, b) => {
        // Invalid JSON files first (critical errors)
        if (a.isValid !== b.isValid) return a.isValid ? 1 : -1;
        // Then by completeness
        if (a.isComplete !== b.isComplete) return a.isComplete ? 1 : -1;
        // Then by quality (actual translations vs placeholders)
        return a.qualityPercent - b.qualityPercent;
      });

      setStatuses(results);
      setLastUpdated(new Date());
      setCachedData(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze translations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      // Always force refresh on first load to avoid stale caches (PWA/browser).
      analyzeTranslations(true);
    }
  }, [analyzeTranslations]);

  const completeCount = statuses.filter(s => s.isComplete && s.isValid).length;
  const invalidCount = statuses.filter(s => !s.isValid).length;
  const totalLanguages = statuses.length;
  const totalPlaceholders = statuses.reduce((sum, s) => sum + s.placeholderKeys.length, 0);

  // Calculate average quality (excluding invalid files)
  const validStatuses = statuses.filter(s => s.isValid);
  const avgQuality = validStatuses.length > 0
    ? Math.round(validStatuses.reduce((sum, s) => sum + s.qualityPercent, 0) / validStatuses.length)
    : 0;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('diagnostics.translationStatus', 'Translation Status')}
          </CardTitle>
          <CardDescription>
            {t('diagnostics.translationStatusDesc', 'Sync status of all language files')}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => analyzeTranslations(true)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Refresh')}
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {/* Dev-only: Invalid JSON warning */}
        {import.meta.env.DEV && invalidCount > 0 && (
          <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md flex items-start gap-2">
            <AlertOctagon className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">
                {t('diagnostics.invalidJsonDetected', '{{count}} locale file(s) have invalid JSON', { count: invalidCount })}
              </div>
              <div className="text-xs mt-1 opacity-80">
                {statuses.filter(s => !s.isValid).map(s => (
                  <div key={s.code} className="font-mono">
                    {s.code}/ui.json: {s.parseError}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              {t('diagnostics.analyzing', 'Analyzing translations...')}
            </span>
          </div>
        )}

        {!loading && totalLanguages === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            {t('diagnostics.noLanguages', 'No language files found. Click Refresh to scan.')}
          </div>
        )}

        {!loading && totalLanguages > 0 && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1 min-w-[120px]">
                <div className="text-sm text-muted-foreground mb-1">
                  {t('diagnostics.syncProgress', 'Sync Progress')}
                </div>
                <Progress value={(completeCount / totalLanguages) * 100} className="h-2" />
              </div>
              <div className="text-right border-r border-border pr-4">
                <div className="text-2xl font-bold">{completeCount}/{totalLanguages}</div>
                <div className="text-xs text-muted-foreground">
                  {t('diagnostics.languagesComplete', 'languages complete')}
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right border-r border-border pr-4 cursor-help">
                      <div className={`text-2xl font-bold ${avgQuality >= 90 ? 'text-green-500' : avgQuality >= 70 ? 'text-warning' : 'text-destructive'}`}>
                        {avgQuality}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('diagnostics.translationQuality', 'translation quality')}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-xs">
                      {t('diagnostics.qualityExplanation', 'Percentage of keys with actual translations (not placeholders). Sync completion ignores placeholders.')}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="text-right cursor-help">
                      <div className={`text-2xl font-bold ${totalPlaceholders > 0 ? 'text-warning' : 'text-green-500'}`}>
                        {totalPlaceholders}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {t('diagnostics.placeholdersRemaining', 'placeholders remaining')}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="text-xs space-y-1">
                      <div className="font-medium mb-2">{t('diagnostics.placeholderBreakdown', 'Per-language breakdown')}</div>
                      {statuses.filter(s => s.placeholderKeys.length > 0).length === 0 ? (
                        <div className="text-muted-foreground">{t('diagnostics.noPlaceholders', 'No placeholders remaining')}</div>
                      ) : (
                        statuses
                          .filter(s => s.placeholderKeys.length > 0)
                          .sort((a, b) => b.placeholderKeys.length - a.placeholderKeys.length)
                          .map(s => (
                            <div key={s.code} className="flex justify-between gap-4">
                              <span className="uppercase font-mono">{s.code}</span>
                              <span className="text-warning">{s.placeholderKeys.length}</span>
                            </div>
                          ))
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                <Clock className="h-3 w-3" />
                {t('diagnostics.lastUpdated', 'Last updated')}: {formatDistanceToNow(lastUpdated, { addSuffix: true })}
              </div>
            )}

            {/* Language List */}
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {statuses.map((status) => (
                  <Collapsible
                    key={status.code}
                    open={expandedLang === status.code}
                    onOpenChange={(open) => setExpandedLang(open ? status.code : null)}
                  >
                    <CollapsibleTrigger asChild>
                      <div
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          !status.isValid 
                            ? 'border-destructive/50 bg-destructive/5'
                            : status.isComplete 
                              ? 'border-border' 
                              : 'border-warning/50 bg-warning/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {!status.isValid ? (
                            <XCircle className="h-4 w-4 text-destructive" />
                          ) : status.isComplete ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              <span className="uppercase text-xs text-muted-foreground font-mono">
                                {status.code}
                              </span>
                              {status.nativeName}
                              {status.code === i18n.language && (
                                <Badge variant="secondary" className="text-xs">
                                  {t('diagnostics.current', 'Current')}
                                </Badge>
                              )}
                              {!status.isValid && (
                                <Badge variant="destructive" className="text-xs">
                                  {t('diagnostics.invalidJson', 'Invalid JSON')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {status.isValid 
                                ? `${status.name} • ${status.totalKeys} ${t('diagnostics.keys', 'keys')}`
                                : status.parseError
                              }
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {status.isValid && !status.isComplete && (
                            <div className="flex gap-1">
                              {status.missingKeys.length > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {status.missingKeys.length} {t('diagnostics.missing', 'missing')}
                                </Badge>
                              )}
                              {status.placeholderKeys.length > 0 && (
                                <Badge variant="outline" className="text-xs border-warning text-warning">
                                  {status.placeholderKeys.length} {t('diagnostics.placeholder', 'placeholder')}
                                </Badge>
                              )}
                            </div>
                          )}
                          {status.isValid && status.isComplete && status.placeholderKeys.length > 0 && (
                            <Badge variant="outline" className="text-xs border-warning text-warning">
                              {status.placeholderKeys.length} {t('diagnostics.placeholder', 'placeholder')}
                            </Badge>
                          )}
                          <div className="w-16 text-right">
                            {status.isValid ? (
                              <span className={`text-sm font-medium ${
                                status.qualityPercent === 100 ? 'text-green-500' : 
                                status.qualityPercent >= 90 ? 'text-emerald-400' :
                                status.qualityPercent >= 70 ? 'text-warning' : 'text-destructive'
                              }`}>
                                {status.qualityPercent}%
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-destructive">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      {!status.isValid && status.parseError && (
                        <div className="mt-2 ml-7 p-3 bg-destructive/10 rounded-md text-xs">
                          <div className="font-medium text-destructive mb-1">
                            {t('diagnostics.parseError', 'Parse Error')}:
                          </div>
                          <div className="font-mono text-muted-foreground">
                            {status.parseError}
                          </div>
                          <div className="mt-2 text-muted-foreground">
                            {t('diagnostics.parseErrorHint', 'Check for syntax errors like extra braces, missing commas, or invalid characters.')}
                          </div>
                        </div>
                      )}
                      {status.isValid && (status.missingKeys.length > 0 || status.placeholderKeys.length > 0) && (
                        <div className="mt-2 ml-7 p-3 bg-muted/30 rounded-md text-xs space-y-3">
                          {status.missingKeys.length > 0 && (
                            <div>
                              <div className="font-medium text-destructive mb-1">
                                {t('diagnostics.missingKeys', 'Missing Keys')}:
                              </div>
                              <div className="font-mono text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                                {status.missingKeys.slice(0, 10).map(key => (
                                  <div key={key}>{key}</div>
                                ))}
                                {status.missingKeys.length > 10 && (
                                  <div className="text-muted-foreground/50">
                                    +{status.missingKeys.length - 10} {t('diagnostics.more', 'more')}...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {status.placeholderKeys.length > 0 && (
                            <div>
                              <div className="font-medium text-warning mb-1">
                                {t('diagnostics.placeholderKeys', 'Placeholder Keys')} ({t('diagnostics.needsTranslation', 'needs translation')}):
                              </div>
                              <div className="font-mono text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                                {status.placeholderKeys.slice(0, 10).map(key => (
                                  <div key={key}>{key}</div>
                                ))}
                                {status.placeholderKeys.length > 10 && (
                                  <div className="text-muted-foreground/50">
                                    +{status.placeholderKeys.length - 10} {t('diagnostics.more', 'more')}...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}