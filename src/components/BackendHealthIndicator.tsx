import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useTranslations } from '@/lib/i18n';

const BackendHealthIndicator = () => {
  const { status, isLoading } = useBackendStatus();
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <div 
        className="flex items-center gap-2 text-xs text-foreground/50"
        role="status"
        aria-live="polite"
        aria-label={t('backendChecking')}
      >
        <span className="w-2 h-2 rounded-full bg-foreground/30 animate-pulse" aria-hidden="true" />
        <span>{t('backendChecking')}</span>
      </div>
    );
  }

  // Show demo mode indicator when using mocks
  const modeLabel = status.isMock ? ' (Demo)' : '';

  // Map new bridge statuses to UI states
  const isError = status.status === "error" || status.backend === "error";
  const isConnecting = status.backend === "disconnected" || status.network === "syncing";
  const isReady = status.status === "ok" && status.backend === "connected" && status.network === "ready";

  if (isError) {
    return (
      <div 
        className="flex items-center gap-2 text-xs text-foreground/50"
        role="status"
        aria-live="polite"
        aria-label={`${t('backendOffline')}${modeLabel}`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400/70" aria-hidden="true" />
        <span>{t('backendOffline')}{modeLabel}</span>
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div 
        className="flex items-center gap-2 text-xs text-foreground/50"
        role="status"
        aria-live="polite"
        aria-label={`${t('backendConnecting')}${modeLabel}`}
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
        <span>{t('backendConnecting')}{modeLabel}</span>
      </div>
    );
  }

  // isReady
  return (
    <div 
      className="flex items-center gap-2 text-xs text-foreground/60"
      role="status"
      aria-live="polite"
      aria-label={`${t('backendLive')}${modeLabel}`}
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" aria-hidden="true" />
      <span>{t('backendLive')}{modeLabel}</span>
    </div>
  );
};

export default BackendHealthIndicator;
