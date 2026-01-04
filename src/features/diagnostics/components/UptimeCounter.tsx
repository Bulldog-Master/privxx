import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours < 24) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days}d ${remainingHours}h`;
}

export function UptimeCounter() {
  const { t } = useTranslation();
  const bridgeHealth = useBridgeHealthStatus();
  const [uptime, setUptime] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const connectionStartRef = useRef<number | null>(null);

  // Track connection state
  useEffect(() => {
    if (bridgeHealth.isLoading) return;

    const healthOk = bridgeHealth.health === true;
    const statusOk = bridgeHealth.status === true;
    const currentlyConnected = healthOk || statusOk;

    if (currentlyConnected && !isConnected) {
      // Just connected
      connectionStartRef.current = Date.now();
      setIsConnected(true);
      setUptime(0);
    } else if (!currentlyConnected && isConnected) {
      // Disconnected
      connectionStartRef.current = null;
      setIsConnected(false);
      setUptime(0);
    }
  }, [bridgeHealth.health, bridgeHealth.status, bridgeHealth.isLoading, isConnected]);

  // Update uptime counter every second
  useEffect(() => {
    if (!isConnected || !connectionStartRef.current) return;

    const interval = setInterval(() => {
      if (connectionStartRef.current) {
        const elapsed = Math.floor((Date.now() - connectionStartRef.current) / 1000);
        setUptime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  if (!isConnected) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-primary/5">
            <Clock className="h-2.5 w-2.5" />
            <span className="font-mono tabular-nums">{formatDuration(uptime)}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{t('uptime.title', 'Session Uptime')}</p>
          <p className="text-muted-foreground text-[10px]">
            {t('uptime.connected', 'Connected for {{duration}}', { duration: formatDuration(uptime) })}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
