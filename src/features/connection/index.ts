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

export { useConnectionHistory, useOfflineDetection } from "./hooks";
export type { ConnectionHistoryEntry, UseConnectionHistoryReturn } from "./hooks";
export type { UseOfflineDetectionReturn } from "./hooks";

// Components
export { ConnectionErrorAlert, ConnectionRetryButton, ConnectionSuccessAnimation, OfflineWarning } from "./components";
