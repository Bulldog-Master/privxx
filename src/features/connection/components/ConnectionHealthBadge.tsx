/**
 * ConnectionHealthBadge Component
 * 
 * Displays overall connection health combining latency and success rate.
 */

import { useTranslation } from "react-i18next";
import { Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  calculateConnectionHealth, 
  getHealthColorClass, 
  getHealthBgClass,
} from "../utils/connectionHealth";
import type { ConnectionHistoryEntry } from "../hooks/useConnectionHistory";

interface ConnectionHealthBadgeProps {
  /** Current latency in ms */
  latency?: number;
  /** Connection history entries */
  history: ConnectionHistoryEntry[];
  /** Show detailed breakdown on hover */
  showDetails?: boolean;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Custom class name */
  className?: string;
}

export function ConnectionHealthBadge({
  latency,
  history,
  showDetails = true,
  size = "md",
  className = "",
}: ConnectionHealthBadgeProps) {
  const { t } = useTranslation();
  
  const health = calculateConnectionHealth(latency, history);
  const colorClass = getHealthColorClass(health.grade);
  const bgClass = getHealthBgClass(health.grade);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const BadgeContent = (
    <Badge
      variant="outline"
      className={`${bgClass} ${colorClass} border-current/30 ${sizeClasses[size]} ${className}`}
    >
      <Activity className={`${iconSizes[size]} mr-1`} aria-hidden="true" />
      <span className="font-semibold">{health.score}</span>
      <span className="ml-1 opacity-70">
        {t(`health.${health.grade}`, health.grade)}
      </span>
    </Badge>
  );

  if (!showDetails) {
    return BadgeContent;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{BadgeContent}</TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="bg-popover/95 backdrop-blur-sm border-border/50 p-3 max-w-xs"
        >
          <div className="space-y-2">
            <div className="font-medium text-foreground">
              {t("health.title", "Connection Health")}
            </div>
            
            <div className="space-y-1.5 text-sm">
              {/* Latency score */}
              <HealthMetric
                label={t("health.latency", "Latency")}
                value={health.latencyScore}
                icon={health.latencyScore >= 70 ? TrendingUp : TrendingDown}
              />
              
              {/* Success rate */}
              <HealthMetric
                label={t("health.successRate", "Success Rate")}
                value={health.successScore}
                icon={health.successScore >= 70 ? TrendingUp : TrendingDown}
              />
              
              {/* Sample size */}
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                {t("health.basedOn", "Based on {{count}} recent attempts", { 
                  count: health.sampleSize 
                })}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface HealthMetricProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

function HealthMetric({ label, value, icon: Icon }: HealthMetricProps) {
  const colorClass = value >= 70 
    ? "text-emerald-500" 
    : value >= 50 
    ? "text-amber-500" 
    : "text-destructive";

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <div className={`flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="font-medium">{value}%</span>
      </div>
    </div>
  );
}
