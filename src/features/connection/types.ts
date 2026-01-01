/**
 * Phase D Message Schema Types
 * 
 * Minimal message formats for cMixx control channel integration.
 * See: docs/PHASE-D-MESSAGE-SCHEMA.md
 */

// Schema version for Phase D
export const SCHEMA_VERSION = 1;

// Connection states
export type ConnectionState = "idle" | "connecting" | "connected";

/**
 * Connect Intent (Client → Server)
 * Sent via cMixx to initiate a private connection
 */
export interface ConnectIntent {
  v: number;              // Schema version (Phase D: 1)
  type: "connect_intent";
  requestId: string;      // Unique request identifier (client-generated)
  sessionId: string;      // Session identifier for this connection attempt
  targetUrl: string;      // URL entered by user (intent only in Phase D)
  clientTime: string;     // ISO timestamp
}

/**
 * Connect ACK (Server → Client)
 * Received via cMixx to confirm connection
 */
export interface ConnectAck {
  v: number;              // Schema version (Phase D: 1)
  type: "connect_ack";
  requestId: string;      // Must match intent requestId
  sessionId: string;      // Must match intent sessionId
  ack: boolean;           // true = success, false = error
  status: "connected" | "error";
  serverTime?: string;    // ISO timestamp
  errorCode?: ConnectErrorCode;
}

/**
 * Allowed error codes in Phase D
 */
export type ConnectErrorCode = 
  | "INVALID_URL"
  | "INVALID_MESSAGE"
  | "SERVER_BUSY"
  | "TIMEOUT"
  | "NETWORK_ERROR";

/**
 * Connection result after attempting to connect
 */
export interface ConnectionResult {
  success: boolean;
  sessionId: string;
  requestId: string;
  latency: number;        // Round-trip time in ms
  errorCode?: ConnectErrorCode;
  errorMessage?: string;
}

/**
 * Create a new connect_intent message
 */
export function createConnectIntent(targetUrl: string): ConnectIntent {
  return {
    v: SCHEMA_VERSION,
    type: "connect_intent",
    requestId: `req_${crypto.randomUUID().slice(0, 8)}`,
    sessionId: `sess_${crypto.randomUUID().slice(0, 8)}`,
    targetUrl,
    clientTime: new Date().toISOString(),
  };
}

/**
 * Validate a connect_ack response
 * Returns true only if this ACK confirms a successful connection
 */
export function validateConnectAck(
  ack: ConnectAck,
  intent: ConnectIntent
): { valid: boolean; error?: string } {
  // Type must be connect_ack
  if (ack.type !== "connect_ack") {
    return { valid: false, error: "Invalid message type" };
  }

  // Request ID must match
  if (ack.requestId !== intent.requestId) {
    return { valid: false, error: "Request ID mismatch" };
  }

  // Session ID must match
  if (ack.sessionId !== intent.sessionId) {
    return { valid: false, error: "Session ID mismatch" };
  }

  // ACK must be true for success
  if (!ack.ack) {
    return { 
      valid: false, 
      error: ack.errorCode || "Connection rejected" 
    };
  }

  return { valid: true };
}
