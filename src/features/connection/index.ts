/**
 * Connection Feature Module
 * 
 * Phase D cMixx integration - event-driven connection flow
 */

// Types
export type {
  ConnectionState,
  ConnectIntent,
  ConnectAck,
  ConnectErrorCode,
  ConnectionResult,
} from "./types";

export {
  SCHEMA_VERSION,
  createConnectIntent,
  validateConnectAck,
} from "./types";

// Service
export { connect, isLiveMode } from "./connectionService";

// Hooks
export { useConnection } from "./useConnection";
export type { UseConnectionOptions, UseConnectionReturn } from "./useConnection";

export { useAutoReconnect, useConnectionHistory, useOfflineDetection, useConnectionQualityMonitor } from "./hooks";
export type { UseAutoReconnectOptions, UseAutoReconnectReturn } from "./hooks";
export type { ConnectionHistoryEntry, UseConnectionHistoryReturn } from "./hooks";
export type { UseOfflineDetectionReturn, QualityAlertConfig } from "./hooks";

// Utils
export { getConnectionQuality, getQualityLabel, getQualityColorClass, getQualityBgClass } from "./utils";
export { calculateConnectionHealth, getHealthColorClass, getHealthBgClass } from "./utils";
export type { ConnectionQuality, QualityThresholds, ConnectionHealthScore } from "./utils";

// Components
export { 
  ConnectionDiagnosticsPanel,
  ConnectionErrorAlert,
  ConnectionHealthBadge,
  ConnectionHistoryPanel,
  ConnectionQualityBadge,
  ConnectionRetryButton, 
  ConnectionSuccessAnimation, 
  OfflineWarning 
} from "./components";
