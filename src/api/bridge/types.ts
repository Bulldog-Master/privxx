/**
 * Bridge API Types (Production Model)
 * 
 * ARCHITECTURE:
 * - Frontend → Bridge (https://privxx.app) → Backend (private localhost)
 * - All authenticated requests require:
 *   - Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
 *   - apikey: <SUPABASE_ANON_KEY>
 * 
 * ENDPOINTS:
 * ┌─────────────────────┬────────┬──────────────────────────────────────────┐
 * │ Endpoint            │ Auth   │ Response Type                            │
 * ├─────────────────────┼────────┼──────────────────────────────────────────┤
 * │ GET  /health        │ No     │ HealthResponse                           │
 * │ GET  /status        │ Yes    │ StatusResponse                           │
 * │ POST /connect       │ Yes    │ ConnectResponse                          │
 * │ POST /disconnect    │ Yes    │ DisconnectResponse                       │
 * │ GET  /unlock/status │ Yes    │ UnlockStatusResponse                     │
 * │ POST /unlock        │ Yes    │ UnlockResponse                           │
 * └─────────────────────┴────────┴──────────────────────────────────────────┘
 * 
 * ERROR RESPONSES:
 * - 401: { code: "missing_token" | "verification_failed", error: string }
 * - 429: { error: "rate limited", retryAfter: number }
 * - 5xx: { error: string }
 */

// =============================================================================
// STATUS ENDPOINT
// =============================================================================

/**
 * GET /status - Connection state
 * 
 * Returns the current tunnel connection state.
 * 
 * @example
 * { "state": "idle" }
 * { "state": "connecting" }
 * { "state": "secure", "connectedAt": "2026-01-07T18:00:00Z", "targetUrl": "http://127.0.0.1:8090" }
 */
export type StatusResponse = {
  /** Current connection state */
  state: "idle" | "connecting" | "secure";
  /** ISO 8601 timestamp when connection was established */
  connectedAt?: string;
  /** Target URL being routed through tunnel */
  targetUrl?: string;
};

// =============================================================================
// CONNECT/DISCONNECT ENDPOINTS
// =============================================================================

/**
 * POST /connect - Request body
 * 
 * @example
 * { "targetUrl": "http://127.0.0.1:8090" }
 */
export type ConnectRequest = {
  /** Target URL - always local VPS address behind Cloudflare */
  targetUrl: string;
};

/**
 * POST /connect - Response
 * 
 * @example
 * { "state": "connecting" }
 * { "state": "secure", "message": "Tunnel established" }
 */
export type ConnectResponse = {
  /** New connection state after connect request */
  state: "connecting" | "secure";
  /** Optional status message */
  message?: string;
};

/**
 * POST /disconnect - Response
 * 
 * @example
 * { "state": "idle", "message": "Tunnel closed" }
 */
export type DisconnectResponse = {
  /** Always "idle" after disconnect */
  state: "idle";
  /** Optional status message */
  message?: string;
};

// =============================================================================
// HEALTH ENDPOINT (PUBLIC)
// =============================================================================

/**
 * GET /health - Bridge health check (no auth required)
 * 
 * @example
 * { "ok": true, "service": "privxx-bridge", "version": "1.0.0", "time": "2026-01-07T18:00:00Z" }
 */
export type HealthResponse = {
  /** True if bridge is healthy */
  ok: boolean;
  /** Service identifier */
  service: string;
  /** Bridge version */
  version: string;
  /** Server time (ISO 8601) */
  time: string;
};

// =============================================================================
// UNLOCK ENDPOINTS
// =============================================================================

/**
 * GET /unlock/status - Lock state
 * 
 * @example
 * { "locked": true }
 * { "locked": false, "expiresAt": "2026-01-07T19:00:00Z" }
 */
export type UnlockStatusResponse = {
  /** True if bridge is locked */
  locked: boolean;
  /** ISO 8601 expiry when unlocked */
  expiresAt?: string;
};

/**
 * POST /unlock - Request body
 */
export type UnlockRequest = {
  password: string;
};

/**
 * POST /unlock - Response
 * 
 * @example
 * { "success": true, "expiresAt": "2026-01-07T19:00:00Z" }
 * { "success": false }
 */
export type UnlockResponse = {
  /** True if unlock succeeded */
  success: boolean;
  /** ISO 8601 unlock expiry */
  expiresAt?: string;
};

/**
 * POST /lock - Response
 * 
 * @example
 * { "success": true }
 */
export type LockResponse = {
  /** True if lock succeeded */
  success: boolean;
};

// Legacy types kept for compatibility during transition
export type SessionResponse = {
  userId: string;
  sessionValid: boolean;
};

export type IdentityState = "none" | "locked" | "unlocked";

export type IdentityStatusResponse = {
  exists: boolean;
  state: IdentityState;
  publicId?: string;
};

export type IdentityCreateResponse = {
  state: IdentityState;
};

export type IdentityUnlockResponse = {
  state: "unlocked";
  expiresAt: string;
};

export type IdentityLockResponse = {
  state: "locked";
};

export type Message = {
  from: string;
  message: string;
  timestamp: string;
};

export type MessageSendResponse = {
  msg_id: string;
  status: "queued";
};

export type MessageInboxResponse = {
  messages: Message[];
};

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface BridgeClientConfig {
  baseUrl: string;
  retry?: RetryConfig;
  timeoutMs?: number;
  /** 
   * Optional async function to fetch the current access token.
   * When provided, the client will call this before each request
   * to automatically attach Authorization headers.
   */
  getAccessToken?: () => Promise<string | null>;
  /**
   * Supabase anon key - REQUIRED for all authenticated requests.
   * Sent as `apikey` header alongside Authorization.
   */
  anonKey?: string;
}

export interface IBridgeClient {
  // Health (public, no auth)
  health(): Promise<HealthResponse>;
  
  // Status (requires auth)
  status(): Promise<StatusResponse>;
  
  // Connection (requires auth)
  connect(targetUrl: string): Promise<ConnectResponse>;
  disconnect(): Promise<DisconnectResponse>;
  
  // Unlock/Lock (requires auth)
  getUnlockStatus(): Promise<UnlockStatusResponse>;
  unlock(password: string): Promise<UnlockResponse>;
  lock(): Promise<LockResponse>;
  
  // Messages (future)
  sendMessage(recipient: string, message: string): Promise<string>;
  getInbox(): Promise<Message[]>;
}
