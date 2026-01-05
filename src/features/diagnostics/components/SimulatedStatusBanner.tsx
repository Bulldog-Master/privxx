import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';

/**
 * Prominent banner for Diagnostics page showing SIMULATED state when xxdkReady=false.
 * Displays version, xxdkReady status, and clear messaging about simulated mode.
 */
export function SimulatedStatusBanner() {
  const { t } = useTranslation();
  const { healthData, isLoading, xxdkReady, isSimulated } = useBridgeHealthStatus();

  // Don't render while loading
  if (isLoading) return null;

  // If xxdkReady is true, show a brief "Live" indicator instead
  if (xxdkReady) {
    return (
      <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {t('diagnostics.liveMode', 'Live Mode')}
          </p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
            {t('diagnostics.liveModeDesc', 'xxDK connected — real cMixx routing active')}
          </p>
        </div>
        {healthData?.version && (
          <span className="text-xs font-mono text-emerald-600/60 dark:text-emerald-400/60">
            v{healthData.version}
          </span>
        )}
      </div>
    );
  }

  // Show SIMULATED banner when xxdkReady=false
  if (isSimulated) {
    return (
      <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-500/15 border-2 border-amber-500/40">
        <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              {t('diagnostics.simulatedBanner', 'SIMULATED')}
            </p>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400">
              xxdkReady: false
            </span>
          </div>
          <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
            {t('diagnostics.simulatedBannerDesc', 'Network initializing — waiting for real xxDK binary deployment')}
          </p>
        </div>
        {healthData?.version && (
          <span className="text-sm font-mono font-semibold text-amber-600 dark:text-amber-400">
            v{healthData.version}
          </span>
        )}
      </div>
    );
  }

  // Unknown state
  return null;
}

export default SimulatedStatusBanner;
