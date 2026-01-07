/**
 * Connection Feature Hooks
 */

export { useAutoReconnect } from "./useAutoReconnect";
export type { UseAutoReconnectOptions, UseAutoReconnectReturn } from "./useAutoReconnect";

export { useAutoRetry } from "./useAutoRetry";
export type { AutoRetryConfig, AutoRetryState, UseAutoRetryReturn } from "./useAutoRetry";

export { useConnectionHistory } from "./useConnectionHistory";
export type { ConnectionHistoryEntry, UseConnectionHistoryReturn } from "./useConnectionHistory";

export { useOfflineDetection } from "./useOfflineDetection";
export type { UseOfflineDetectionReturn } from "./useOfflineDetection";

export { useConnectionQualityMonitor } from "./useConnectionQualityMonitor";
export type { QualityAlertConfig } from "./useConnectionQualityMonitor";
