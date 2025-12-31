import { Link } from 'react-router-dom';
import { useQuery, useIsFetching } from '@tanstack/react-query';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';

type HealthLevel = 'healthy' | 'degraded' | 'offline' | 'loading';

export function HealthIndicatorDot() {
  const { t } = useTranslation();
  const bridgeHealth = useBridgeHealthStatus();
  
  // Check if any bridge-related queries are actively fetching
  const isFetchingBridge = useIsFetching({ queryKey: ['bridge-health'] }) > 0;
  const isFetchingXxdk = useIsFetching({ queryKey: ['bridge-xxdk-info'] }) > 0;
  const isFetchingCmixx = useIsFetching({ queryKey: ['bridge-cmixx-status'] }) > 0;
  const isActivelyChecking = isFetchingBridge || isFetchingXxdk || isFetchingCmixx;

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
            {/* Ping animation when not loading */}
            {level !== 'loading' && !isActivelyChecking && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${pulseColors[level]}`}
                style={{ animationDuration: '2s' }}
              />
            )}
            {/* Fast pulse when actively checking */}
            {isActivelyChecking && level !== 'loading' && (
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-60 ${pulseColors[level]}`}
                style={{ 
                  animation: 'pulse 0.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
              />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${colors[level]} ${
                level === 'loading' || isActivelyChecking ? 'animate-pulse' : ''
              }`}
            />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{labels[level]}</p>
          {isActivelyChecking && (
            <p className="text-primary text-[10px]">{t('healthIndicator.checking', 'Checking status...')}</p>
          )}
          <p className="text-muted-foreground text-[10px]">{t('healthIndicator.clickForDetails', 'Click for details')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
