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

// Hook
export { useConnection } from "./useConnection";
export type { UseConnectionOptions, UseConnectionReturn } from "./useConnection";

// Components
export { ConnectionErrorAlert, ConnectionRetryButton } from "./components";
