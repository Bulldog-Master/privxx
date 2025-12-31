import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Server, Wifi, Shield, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBridgeHealthStatus } from '../hooks/useBridgeHealthStatus';

type StatusType = 'ok' | 'error' | 'loading' | 'unknown';

interface StatusBadgeProps {
  label: string;
  status: StatusType;
  tooltip: string;
  icon: React.ReactNode;
}

function StatusBadge({ label, status, tooltip, icon }: StatusBadgeProps) {
  const statusColors: Record<StatusType, string> = {
    ok: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    loading: 'bg-muted text-muted-foreground border-border',
    unknown: 'bg-muted/50 text-muted-foreground/70 border-border/50',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`gap-1 cursor-help text-[10px] px-1.5 py-0.5 ${statusColors[status]}`}
          >
            {status === 'loading' ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              icon
            )}
            <span className="font-medium">{label}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BackendStatusBadges() {
  const { t } = useTranslation();
  const bridgeHealth = useBridgeHealthStatus();

  const getStatus = (
    isLoading: boolean,
    value: boolean | null,
    error: boolean
  ): StatusType => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (value === true) return 'ok';
    if (value === false) return 'error';
    return 'unknown';
  };

  const proxyStatus = getStatus(
    bridgeHealth.isLoading,
    bridgeHealth.health,
    bridgeHealth.healthError
  );

  const bridgeStatus = getStatus(
    bridgeHealth.isLoading,
    bridgeHealth.xxdkInfo,
    bridgeHealth.xxdkError
  );

  const cmixxStatus = getStatus(
    bridgeHealth.isLoading,
    bridgeHealth.cmixxStatus,
    bridgeHealth.cmixxError
  );

  const getTooltip = (name: string, status: StatusType): string => {
    switch (status) {
      case 'ok':
        return t('backendStatus.connected', '{{name}} connected', { name });
      case 'error':
        return t('backendStatus.unreachable', '{{name}} unreachable', { name });
      case 'loading':
        return t('backendStatus.checking', 'Checking {{name}}...', { name });
      default:
        return t('backendStatus.unknown', '{{name}} status unknown', { name });
    }
  };

  return (
    <Link 
      to="/diagnostics" 
      className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-primary/10 transition-colors"
      aria-label={t('healthIndicator.clickForDetails', 'Click for details')}
    >
      <StatusBadge
        label="Proxy"
        status={proxyStatus}
        tooltip={getTooltip('Proxy', proxyStatus)}
        icon={<Server className="h-2.5 w-2.5" />}
      />
      <StatusBadge
        label="Bridge"
        status={bridgeStatus}
        tooltip={getTooltip('Bridge', bridgeStatus)}
        icon={<Wifi className="h-2.5 w-2.5" />}
      />
      <StatusBadge
        label="xxDK"
        status={cmixxStatus}
        tooltip={getTooltip('cMixx', cmixxStatus)}
        icon={<Shield className="h-2.5 w-2.5" />}
      />
    </Link>
  );
}
