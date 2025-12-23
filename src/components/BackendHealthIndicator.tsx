import { useBackendStatus } from '@/hooks/useBackendStatus';
import { formatUptime } from '@/lib/privxx-api';
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

  if (!status.connected) {
    return (
      <div className="flex items-center gap-2 text-xs text-foreground/50">
        <span className="w-2 h-2 rounded-full bg-amber-400/70" />
        <span>{t('backendOffline')}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-foreground/60">
      <span className={`w-2 h-2 rounded-full ${
        status.ready 
          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' 
          : 'bg-amber-400'
      }`} />
      <span>
        {status.ready ? t('backendLive') : t('backendConnecting')}
        {status.uptimeSec > 0 && (
          <span className="text-foreground/40 ml-1">
            · {formatUptime(status.uptimeSec)}
          </span>
        )}
      </span>
    </div>
  );
};

export default BackendHealthIndicator;
