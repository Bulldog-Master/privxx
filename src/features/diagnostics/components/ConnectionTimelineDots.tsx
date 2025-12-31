import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';
import { useConnectionQualityAlerts } from '@/hooks/useConnectionQualityAlerts';
import { formatDistanceToNow } from 'date-fns';

type EventStatus = 'ok' | 'degraded' | 'error';
type LatencyQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

interface ConnectionEvent {
  id: number;
  status: EventStatus;
  timestamp: Date;
  latency?: number;
}

const MAX_EVENTS = 5;

function getLatencyQuality(latency: number | undefined): LatencyQuality {
  if (latency === undefined) return 'unknown';
  if (latency < 100) return 'excellent';
  if (latency < 300) return 'good';
  if (latency < 600) return 'fair';
  return 'poor';
}

function LatencyBar({ latency }: { latency: number | undefined }) {
  const { t } = useTranslation();
  const quality = getLatencyQuality(latency);
  
  const barHeights: Record<LatencyQuality, number[]> = {
    excellent: [1, 1, 1, 1],
    good: [1, 1, 1, 0.3],
    fair: [1, 1, 0.3, 0.3],
    poor: [1, 0.3, 0.3, 0.3],
    unknown: [0.3, 0.3, 0.3, 0.3],
  };
  
  const colors: Record<LatencyQuality, string> = {
    excellent: 'bg-emerald-500',
    good: 'bg-emerald-400',
    fair: 'bg-amber-500',
    poor: 'bg-red-500',
    unknown: 'bg-muted-foreground',
  };

  const labels: Record<LatencyQuality, string> = {
    excellent: t('latency.excellent', 'Excellent'),
    good: t('latency.good', 'Good'),
    fair: t('latency.fair', 'Fair'),
    poor: t('latency.poor', 'Poor'),
    unknown: t('latency.unknown', 'Unknown'),
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-end gap-[1px] h-2.5 px-1 cursor-default">
            {barHeights[quality].map((opacity, i) => (
              <span
                key={i}
                className={`w-[2px] rounded-sm transition-all ${colors[quality]}`}
                style={{ 
                  height: `${(i + 1) * 25}%`,
                  opacity,
                }}
              />
            ))}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-medium">{labels[quality]}</p>
          {latency !== undefined && (
            <p className="text-muted-foreground text-[10px]">{latency}ms</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ConnectionTimelineDots() {
  const { t } = useTranslation();
  const bridgeHealth = useBridgeHealthStatus();
  const [events, setEvents] = useState<ConnectionEvent[]>([]);
  const [currentLatency, setCurrentLatency] = useState<number | undefined>();
  const lastStatusRef = useRef<EventStatus | null>(null);
  const eventIdRef = useRef(0);
  const requestStartRef = useRef<number | null>(null);

  // Track request timing for latency calculation
  useEffect(() => {
    if (bridgeHealth.isLoading && requestStartRef.current === null) {
      requestStartRef.current = performance.now();
    } else if (!bridgeHealth.isLoading && requestStartRef.current !== null) {
      const latency = Math.round(performance.now() - requestStartRef.current);
      setCurrentLatency(latency);
      requestStartRef.current = null;
    }
  }, [bridgeHealth.isLoading]);

  // Derive current connection status
  const proxyOk = bridgeHealth.health === true;
  const bridgeOk = bridgeHealth.xxdkInfo === true;
  const cmixxOk = bridgeHealth.cmixxStatus === true;

  let connectionStatus: EventStatus;
  if (proxyOk && bridgeOk && cmixxOk) {
    connectionStatus = 'ok';
  } else if (proxyOk || bridgeOk) {
    connectionStatus = 'degraded';
  } else {
    connectionStatus = 'error';
  }

  // Enable connection quality alerts
  useConnectionQualityAlerts({
    status: connectionStatus,
    latency: currentLatency,
  });

  useEffect(() => {
    if (bridgeHealth.isLoading) return;

    // Only add event if status changed or it's the first check
    if (lastStatusRef.current !== connectionStatus) {
      lastStatusRef.current = connectionStatus;
      eventIdRef.current += 1;
      
      setEvents((prev) => {
        const newEvent: ConnectionEvent = {
          id: eventIdRef.current,
          status: connectionStatus,
          timestamp: new Date(),
          latency: currentLatency,
        };
        return [newEvent, ...prev].slice(0, MAX_EVENTS);
      });
    }
  }, [connectionStatus, bridgeHealth.isLoading, currentLatency]);

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
    <div className="flex items-center gap-0.5">
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
                  className={`w-1.5 h-1.5 rounded-full ${statusColors[event.status]} transition-all ${index === 0 ? 'animate-scale-in' : ''}`}
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
                  {event.latency && (
                    <span className="text-muted-foreground">{event.latency}ms</span>
                  )}
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
      <LatencyBar latency={currentLatency} />
    </div>
  );
}
