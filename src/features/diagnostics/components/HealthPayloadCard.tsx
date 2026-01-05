import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';

/**
 * Displays the raw /health endpoint payload for transparency.
 * Shows version, xxdkReady status, and overall health state.
 */
export function HealthPayloadCard() {
  const { t } = useTranslation();
  const { healthData, isLoading, healthError, xxdkReady, isSimulated } = useBridgeHealthStatus();

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          {t('diagnostics.healthPayload', 'Bridge Health Payload')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t('common.loading', 'Loading...')}</span>
          </div>
        ) : healthError ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{t('diagnostics.healthError', 'Failed to fetch health')}</span>
          </div>
        ) : healthData ? (
          <div className="space-y-2">
            {/* Health Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('diagnostics.status', 'Status')}</span>
              <Badge variant={healthData.ok ? 'default' : 'destructive'} className="text-xs">
                {healthData.ok ? 'OK' : 'Error'}
              </Badge>
            </div>

            {/* Version */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('diagnostics.version', 'Version')}</span>
              <span className="text-sm font-mono">{healthData.version || '—'}</span>
            </div>

            {/* Service */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('diagnostics.service', 'Service')}</span>
              <span className="text-sm font-mono">{healthData.service || '—'}</span>
            </div>

            {/* xxDK Ready - prominently displayed */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm font-medium">{t('diagnostics.xxdkReady', 'xxDK Ready')}</span>
              {xxdkReady ? (
                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {t('diagnostics.realMode', 'Real')}
                </Badge>
              ) : isSimulated ? (
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {t('diagnostics.simulatedMode', 'Simulated')}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {t('common.unknown', 'Unknown')}
                </Badge>
              )}
            </div>

            {/* Timestamp */}
            {healthData.time && (
              <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                <span>{t('diagnostics.timestamp', 'Timestamp')}</span>
                <span className="font-mono">{new Date(healthData.time).toLocaleTimeString()}</span>
              </div>
            )}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{t('diagnostics.noData', 'No data')}</span>
        )}
      </CardContent>
    </Card>
  );
}

export default HealthPayloadCard;
