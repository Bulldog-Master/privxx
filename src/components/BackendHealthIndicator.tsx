import { useBackendStatus } from '@/hooks/useBackendStatus';
import { useTranslations } from '@/lib/i18n';

const BackendHealthIndicator = () => {
  const { status, isLoading } = useBackendStatus();
  const { t } = useTranslations();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <span className="w-2 h-2 rounded-full bg-foreground/30 animate-pulse" />
        <span>{t('backendChecking')}</span>
      </div>
    );
  }

  // Show demo mode indicator when using mocks
  const modeLabel = status.isMock ? ' (Demo)' : '';

  if (status.state === "error") {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <span className="w-2 h-2 rounded-full bg-amber-400/70" />
        <span>{t('backendOffline')}{modeLabel}</span>
      </div>
    );
  }

  if (status.state === "starting") {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span>{t('backendConnecting')}{modeLabel}</span>
      </div>
    );
  }

  // state === "ready"
  return (
    <div className="flex items-center gap-2 text-xs text-foreground/60">
      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
      <span>{t('backendLive')}{modeLabel}</span>
    </div>
  );
};

export default BackendHealthIndicator;
