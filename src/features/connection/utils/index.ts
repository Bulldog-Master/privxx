/**
 * Connection Feature Utilities
 */

export { 
  getConnectionQuality, 
  getQualityLabel,
  getQualityColorClass,
  getQualityBgClass,
  DEFAULT_THRESHOLDS,
  type ConnectionQuality,
  type QualityThresholds,
} from "./connectionQuality";

export {
  calculateConnectionHealth,
  getHealthColorClass,
  getHealthBgClass,
  type ConnectionHealthScore,
} from "./connectionHealth";
