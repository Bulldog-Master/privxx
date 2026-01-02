/**
 * ConnectionQualityBadge
 * 
 * Displays a quality indicator based on connection latency.
 */

import { Signal, SignalHigh, SignalMedium, SignalLow, SignalZero } from "lucide-react";
import { useTranslation } from "react-i18next";
import { 
  getConnectionQuality, 
  getQualityColorClass, 
  getQualityBgClass,
  type ConnectionQuality 
} from "../utils/connectionQuality";

interface ConnectionQualityBadgeProps {
  latency: number | undefined;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const qualityIcons: Record<ConnectionQuality, typeof Signal> = {
  excellent: Signal,
  good: SignalHigh,
  fair: SignalMedium,
  poor: SignalLow,
  unknown: SignalZero,
};

export function ConnectionQualityBadge({ 
  latency, 
  showLabel = true,
  size = "md" 
}: ConnectionQualityBadgeProps) {
  const { t } = useTranslation();
  const quality = getConnectionQuality(latency);
  const Icon = qualityIcons[quality];
  const colorClass = getQualityColorClass(quality);
  const bgClass = getQualityBgClass(quality);

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs gap-1",
    md: "px-2 py-1 text-sm gap-1.5",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
  };

  const qualityLabels: Record<ConnectionQuality, string> = {
    excellent: t("latency.excellent", "Excellent"),
    good: t("latency.good", "Good"),
    fair: t("latency.fair", "Fair"),
    poor: t("latency.poor", "Poor"),
    unknown: t("latency.unknown", "Unknown"),
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full ${bgClass} ${sizeClasses[size]}`}
      role="status"
      aria-label={`Connection quality: ${qualityLabels[quality]}`}
    >
      <Icon className={`${iconSizes[size]} ${colorClass}`} />
      {showLabel && (
        <span className={`font-medium ${colorClass}`}>
          {qualityLabels[quality]}
        </span>
      )}
      {latency !== undefined && (
        <span className="text-muted-foreground font-mono">
          {latency}ms
        </span>
      )}
    </div>
  );
}

export default ConnectionQualityBadge;
