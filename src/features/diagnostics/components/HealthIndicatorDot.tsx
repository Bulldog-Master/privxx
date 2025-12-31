import { Link } from 'react-router-dom';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

type HealthLevel = 'healthy' | 'degraded' | 'offline' | 'loading';

export function HealthIndicatorDot() {
  const { t } = useTranslation();
  const bridgeHealth = useBridgeHealthStatus();

  const getHealthLevel = (): HealthLevel => {
    if (bridgeHealth.isLoading) return 'loading';
    
    const proxyOk = bridgeHealth.health === true;
    const bridgeOk = bridgeHealth.xxdkInfo === true;
    const cmixxOk = bridgeHealth.cmixxStatus === true;
    
    if (proxyOk && bridgeOk && cmixxOk) return 'healthy';
    if (proxyOk || bridgeOk) return 'degraded';
    return 'offline';
  };

  const level = getHealthLevel();

  const colors: Record<HealthLevel, string> = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    offline: 'bg-red-500',
    loading: 'bg-muted-foreground',
  };

  const pulseColors: Record<HealthLevel, string> = {
    healthy: 'bg-emerald-400',
    degraded: 'bg-amber-400',
    offline: 'bg-red-400',
    loading: 'bg-muted-foreground',
  };

  const labels: Record<HealthLevel, string> = {
    healthy: t('healthIndicator.healthy', 'All systems operational'),
    degraded: t('healthIndicator.degraded', 'Some services degraded'),
    offline: t('healthIndicator.offline', 'Services unreachable'),
    loading: t('healthIndicator.checking', 'Checking status...'),
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to="/diagnostics" 
            className="relative inline-flex h-2 w-2 cursor-pointer transition-transform hover:scale-125"
            aria-label={labels[level]}
          >
            {level !== 'loading' && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pulseColors[level]}`}
                style={{ animationDuration: '2s' }}
              />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${colors[level]} ${
                level === 'loading' ? 'animate-pulse' : ''
              }`}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{labels[level]}</p>
          <p className="text-muted-foreground text-[10px]">{t('healthIndicator.clickForDetails', 'Click for details')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
