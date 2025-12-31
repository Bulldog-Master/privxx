import { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/useToast';

interface QualityThresholds {
  latencyWarning: number;   // ms - show warning
  latencyCritical: number;  // ms - show error
  degradedDuration: number; // ms - how long before alerting
}

const DEFAULT_THRESHOLDS: QualityThresholds = {
  latencyWarning: 500,
  latencyCritical: 1000,
  degradedDuration: 10000, // 10 seconds of poor quality
};

type ConnectionStatus = 'ok' | 'degraded' | 'error';
type LatencyQuality = 'excellent' | 'good' | 'fair' | 'poor';

interface ConnectionQualityState {
  status: ConnectionStatus;
  latency: number | undefined;
}

export function useConnectionQualityAlerts(
  state: ConnectionQualityState,
  thresholds: Partial<QualityThresholds> = {}
) {
  const { t } = useTranslation();
  const mergedThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  
  const lastAlertRef = useRef<{
    type: 'latency' | 'status' | 'recovery';
    timestamp: number;
  } | null>(null);
  
  const degradedStartRef = useRef<number | null>(null);
  const previousStatusRef = useRef<ConnectionStatus>('ok');
  const previousLatencyQualityRef = useRef<LatencyQuality>('excellent');

  const getLatencyQuality = useCallback((latency: number | undefined): LatencyQuality => {
    if (latency === undefined) return 'excellent';
    if (latency < 100) return 'excellent';
    if (latency < 300) return 'good';
    if (latency < 600) return 'fair';
    return 'poor';
  }, []);

  const shouldShowAlert = useCallback((type: 'latency' | 'status' | 'recovery'): boolean => {
    const now = Date.now();
    const cooldown = 30000; // 30 second cooldown between same alert types
    
    if (lastAlertRef.current?.type === type && 
        now - lastAlertRef.current.timestamp < cooldown) {
      return false;
    }
    return true;
  }, []);

  const showAlert = useCallback((
    type: 'latency' | 'status' | 'recovery',
    variant: 'default' | 'destructive',
    title: string,
    description: string
  ) => {
    if (!shouldShowAlert(type)) return;
    
    lastAlertRef.current = { type, timestamp: Date.now() };
    
    toast({
      title,
      description,
      variant,
    });
  }, [shouldShowAlert]);

  // Monitor latency quality changes
  useEffect(() => {
    const currentQuality = getLatencyQuality(state.latency);
    const previousQuality = previousLatencyQualityRef.current;
    
    // Latency degraded to poor
    if (currentQuality === 'poor' && previousQuality !== 'poor' && state.latency !== undefined) {
      if (state.latency >= mergedThresholds.latencyCritical) {
        showAlert(
          'latency',
          'destructive',
          t('alerts.latencyCritical.title', 'Connection Very Slow'),
          t('alerts.latencyCritical.description', 'Latency is critically high ({{latency}}ms). Connection quality is severely degraded.', { latency: state.latency })
        );
      } else if (state.latency >= mergedThresholds.latencyWarning) {
        showAlert(
          'latency',
          'default',
          t('alerts.latencyWarning.title', 'High Latency Detected'),
          t('alerts.latencyWarning.description', 'Connection latency is elevated ({{latency}}ms). Performance may be affected.', { latency: state.latency })
        );
      }
    }
    
    // Latency improved from poor to good/excellent
    if ((currentQuality === 'excellent' || currentQuality === 'good') && 
        (previousQuality === 'poor' || previousQuality === 'fair')) {
      showAlert(
        'recovery',
        'default',
        t('alerts.latencyRecovered.title', 'Connection Improved'),
        t('alerts.latencyRecovered.description', 'Latency has returned to normal levels.')
      );
    }
    
    previousLatencyQualityRef.current = currentQuality;
  }, [state.latency, getLatencyQuality, showAlert, t, mergedThresholds]);

  // Monitor connection status changes
  useEffect(() => {
    const currentStatus = state.status;
    const previousStatus = previousStatusRef.current;
    
    // Connection went down
    if (currentStatus === 'error' && previousStatus !== 'error') {
      showAlert(
        'status',
        'destructive',
        t('alerts.connectionLost.title', 'Connection Lost'),
        t('alerts.connectionLost.description', 'Unable to reach the mixnet. Attempting to reconnect...')
      );
      degradedStartRef.current = null;
    }
    
    // Connection degraded
    if (currentStatus === 'degraded' && previousStatus === 'ok') {
      degradedStartRef.current = Date.now();
    }
    
    // Check if degraded for too long
    if (currentStatus === 'degraded' && degradedStartRef.current) {
      const duration = Date.now() - degradedStartRef.current;
      if (duration >= mergedThresholds.degradedDuration) {
        showAlert(
          'status',
          'default',
          t('alerts.connectionDegraded.title', 'Connection Degraded'),
          t('alerts.connectionDegraded.description', 'Some services are unavailable. Core functionality may be limited.')
        );
        degradedStartRef.current = null; // Reset to prevent repeated alerts
      }
    }
    
    // Connection recovered
    if (currentStatus === 'ok' && (previousStatus === 'error' || previousStatus === 'degraded')) {
      showAlert(
        'recovery',
        'default',
        t('alerts.connectionRestored.title', 'Connection Restored'),
        t('alerts.connectionRestored.description', 'All systems are operational.')
      );
      degradedStartRef.current = null;
    }
    
    previousStatusRef.current = currentStatus;
  }, [state.status, showAlert, t, mergedThresholds]);

  return null;
}
