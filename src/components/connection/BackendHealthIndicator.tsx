import { useTranslation } from "react-i18next";
import { useBackendStatusContext } from "@/contexts/BackendStatusContext";
import type { ConnectionHealth } from "@/hooks/useBackendStatus";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const healthConfig: Record<ConnectionHealth, {
  dotClass: string;
  textClass: string;
  labelKey: string;
}> = {
  healthy: {
    dotClass: "bg-emerald-400 shadow-sm shadow-emerald-400/50",
    textClass: "text-primary/60",
    labelKey: "connectionConnected",
  },
  degraded: {
    dotClass: "bg-amber-400 animate-pulse",
    textClass: "text-primary/50",
    labelKey: "connectionDegraded",
  },
  offline: {
    dotClass: "bg-red-400/70",
    textClass: "text-primary/50",
    labelKey: "connectionError",
  },
  checking: {
    dotClass: "bg-primary/30 animate-pulse",
    textClass: "text-primary/50",
    labelKey: "connectionChecking",
  },
};

const BackendHealthIndicator = () => {
  const { status, isLoading, refetch } = useBackendStatusContext();
  const { t } = useTranslation();

  const health: ConnectionHealth = isLoading ? "checking" : status.health;
  const config = healthConfig[health];
  
  // Show demo mode indicator when using mocks
  const modeLabel = status.isMock ? " (Demo)" : "";
  
  // Format latency for tooltip
  const latencyText = status.latencyMs !== null 
    ? `${status.latencyMs}ms` 
    : "—";
  
  // Format last check time
  const lastCheckText = status.lastCheckAt 
    ? status.lastCheckAt.toLocaleTimeString() 
    : "—";

  // Build tooltip content
  const tooltipLines = [
    `Status: ${t(config.labelKey)}`,
    `Latency: ${latencyText}`,
    `Last check: ${lastCheckText}`,
  ];
  
  if (status.failureCount > 0) {
    tooltipLines.push(`Failures: ${status.failureCount}`);
  }
  
  if (status.lastErrorCode) {
    tooltipLines.push(`Last error: ${status.lastErrorCode}`);
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => refetch()}
            className={`flex items-center gap-2 text-xs ${config.textClass} hover:opacity-80 transition-opacity cursor-pointer`}
            role="status"
            aria-live="polite"
            aria-label={`${t(config.labelKey)}${modeLabel}`}
          >
            <span 
              className={`w-2 h-2 rounded-full ${config.dotClass}`} 
              aria-hidden="true" 
            />
            <span>{t(config.labelKey)}{modeLabel}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="text-xs space-y-1 bg-background/95 backdrop-blur-sm"
        >
          {tooltipLines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
          <div className="text-muted-foreground pt-1 border-t border-border/50">
            Click to refresh
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BackendHealthIndicator;
