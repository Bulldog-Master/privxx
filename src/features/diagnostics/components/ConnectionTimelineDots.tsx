import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';
import { formatDistanceToNow } from 'date-fns';

type EventStatus = 'ok' | 'degraded' | 'error';

interface ConnectionEvent {
  id: number;
  status: EventStatus;
  timestamp: Date;
}

const MAX_EVENTS = 5;

export function ConnectionTimelineDots() {
  const { t } = useTranslation();
  const bridgeHealth = useBridgeHealthStatus();
  const [events, setEvents] = useState<ConnectionEvent[]>([]);
  const lastStatusRef = useRef<EventStatus | null>(null);
  const eventIdRef = useRef(0);

  useEffect(() => {
    if (bridgeHealth.isLoading) return;

    const proxyOk = bridgeHealth.health === true;
    const bridgeOk = bridgeHealth.xxdkInfo === true;
    const cmixxOk = bridgeHealth.cmixxStatus === true;

    let currentStatus: EventStatus;
    if (proxyOk && bridgeOk && cmixxOk) {
      currentStatus = 'ok';
    } else if (proxyOk || bridgeOk) {
      currentStatus = 'degraded';
    } else {
      currentStatus = 'error';
    }

    // Only add event if status changed or it's the first check
    if (lastStatusRef.current !== currentStatus) {
      lastStatusRef.current = currentStatus;
      eventIdRef.current += 1;
      
      setEvents((prev) => {
        const newEvent: ConnectionEvent = {
          id: eventIdRef.current,
          status: currentStatus,
          timestamp: new Date(),
        };
        return [newEvent, ...prev].slice(0, MAX_EVENTS);
      });
    }
  }, [bridgeHealth.health, bridgeHealth.xxdkInfo, bridgeHealth.cmixxStatus, bridgeHealth.isLoading]);

  const statusColors: Record<EventStatus, string> = {
    ok: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    error: 'bg-red-500',
  };

  const statusLabels: Record<EventStatus, string> = {
    ok: t('connectionTimeline.connected', 'Connected'),
    degraded: t('connectionTimeline.degraded', 'Degraded'),
    error: t('connectionTimeline.disconnected', 'Disconnected'),
  };

  if (events.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to="/diagnostics" 
            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors cursor-pointer"
            aria-label={t('connectionTimeline.recentEvents', 'Recent connectivity events')}
          >
            {events.map((event, index) => (
              <span
                key={event.id}
                className={`w-1.5 h-1.5 rounded-full ${statusColors[event.status]} transition-all`}
                style={{ 
                  opacity: 1 - (index * 0.15),
                }}
              />
            ))}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs max-w-[200px]">
          <p className="font-medium mb-1">
            {t('connectionTimeline.title', 'Connection History')}
          </p>
          <div className="space-y-0.5">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-1.5 text-[10px]">
                <span className={`w-1.5 h-1.5 rounded-full ${statusColors[event.status]}`} />
                <span>{statusLabels[event.status]}</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-[10px] mt-1">
            {t('healthIndicator.clickForDetails', 'Click for details')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
