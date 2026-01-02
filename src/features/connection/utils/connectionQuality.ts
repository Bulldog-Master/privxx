/**
 * Connection Quality Utilities
 * 
 * Grades connection quality based on latency thresholds.
 */

export type ConnectionQuality = "excellent" | "good" | "fair" | "poor" | "unknown";

export interface QualityThresholds {
  excellent: number;
  good: number;
  fair: number;
}

export const DEFAULT_THRESHOLDS: QualityThresholds = {
  excellent: 500,  // < 500ms
  good: 1000,      // < 1000ms
  fair: 2000,      // < 2000ms
  // >= 2000ms is poor
};

/**
 * Get connection quality grade based on latency
 */
export function getConnectionQuality(
  latency: number | undefined,
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS
): ConnectionQuality {
  if (latency === undefined || latency < 0) {
    return "unknown";
  }

  if (latency < thresholds.excellent) {
    return "excellent";
  }
  if (latency < thresholds.good) {
    return "good";
  }
  if (latency < thresholds.fair) {
    return "fair";
  }
  return "poor";
}

/**
 * Get quality label for display
 */
export function getQualityLabel(quality: ConnectionQuality): string {
  const labels: Record<ConnectionQuality, string> = {
    excellent: "Excellent",
    good: "Good",
    fair: "Fair",
    poor: "Poor",
    unknown: "Unknown",
  };
  return labels[quality];
}

/**
 * Get CSS color class for quality
 */
export function getQualityColorClass(quality: ConnectionQuality): string {
  const colors: Record<ConnectionQuality, string> = {
    excellent: "text-emerald-400",
    good: "text-green-400",
    fair: "text-yellow-400",
    poor: "text-red-400",
    unknown: "text-muted-foreground",
  };
  return colors[quality];
}

/**
 * Get background CSS class for quality badge
 */
export function getQualityBgClass(quality: ConnectionQuality): string {
  const colors: Record<ConnectionQuality, string> = {
    excellent: "bg-emerald-400/20",
    good: "bg-green-400/20",
    fair: "bg-yellow-400/20",
    poor: "bg-red-400/20",
    unknown: "bg-muted/20",
  };
  return colors[quality];
}
