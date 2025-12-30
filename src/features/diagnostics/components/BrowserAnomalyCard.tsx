import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Fingerprint, ChevronDown, AlertTriangle, Shield } from 'lucide-react';
import { collectBrowserAnomalySignals, detectAnomalies } from '@/lib/browserAnomalySignals';

/**
 * Browser Anomaly Detection Card (Phase-2 Diagnostic Stub)
 * 
 * Displays browser fingerprint signals for diagnostic purposes only.
 * No signals are sent to any backend or stored persistently.
 */
export function BrowserAnomalyCard() {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const { signals, anomalies } = useMemo(() => {
    const collected = collectBrowserAnomalySignals();
    const detected = detectAnomalies(collected);
    return { signals: collected, anomalies: detected };
  }, []);

  const hasAnomalies = anomalies.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          {t('diagnostics.browserAnomaly', 'Browser Anomaly Detection')}
          <Badge variant="outline" className="text-xs ml-2">
            {t('diagnostics.phase2Preview', 'Phase-2 Preview')}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t('diagnostics.browserAnomalyDesc', 'Browser signal analysis for anomaly detection (diagnostic only)')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className={`flex items-center gap-3 p-3 rounded-lg ${
          hasAnomalies ? 'bg-warning/10 border border-warning/30' : 'bg-green-500/10 border border-green-500/30'
        }`}>
          {hasAnomalies ? (
            <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          ) : (
            <Shield className="h-5 w-5 text-green-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-medium">
              {hasAnomalies 
                ? t('diagnostics.anomaliesDetected', '{{count}} anomaly signals detected', { count: anomalies.length })
                : t('diagnostics.noAnomalies', 'No anomalies detected')
              }
            </div>
            {hasAnomalies && (
              <ul className="text-xs text-muted-foreground mt-1 list-disc list-inside">
                {anomalies.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Expandable Signal Details */}
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between">
              {t('diagnostics.viewSignals', 'View collected signals')}
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="mt-3 p-3 bg-muted/50 rounded-md text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto">
              {JSON.stringify(signals, null, 2)}
            </pre>
          </CollapsibleContent>
        </Collapsible>

        {/* Privacy Notice */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
          {t('diagnostics.browserAnomalyPrivacy', 'Diagnostic only. No signals are sent or stored. This data never leaves your browser.')}
        </div>
      </CardContent>
    </Card>
  );
}
