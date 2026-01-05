import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useBridgeHealthStatus } from '@/features/diagnostics/hooks/useBridgeHealthStatus';

/**
 * Displays a prominent warning when the bridge is running in simulated mode
 * (xxdkReady=false). This helps users understand that real cMixx routing
 * is not yet active.
 */
export function SimulatedModeBanner() {
  const { t } = useTranslation();
  const { healthData, isLoading } = useBridgeHealthStatus();

  // Don't show while loading or if xxdkReady is true (real mode)
  if (isLoading || healthData?.xxdkReady === true) {
    return null;
  }

  // Only show if we have health data and xxdkReady is explicitly false
  if (!healthData || healthData.xxdkReady !== false) {
    return null;
  }

  return (
    <div className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
      <div className="flex-1 text-left">
        <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
          {t('simulatedMode.title', 'Network Initializing')}
        </p>
        <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
          {t('simulatedMode.description', 'xxDK not connected — waiting for backend integration')}
        </p>
      </div>
      {healthData.version && (
        <span className="text-xs font-mono text-amber-600/60 dark:text-amber-400/60">
          v{healthData.version}
        </span>
      )}
    </div>
  );
}

export default SimulatedModeBanner;
