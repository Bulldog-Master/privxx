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
 * { "state": "secure", "targetUrl": "https://example.com", "sessionId": "sim-...", "latency": 123 }
 */
export type StatusResponse = {
  /** Current connection state */
  state: "idle" | "connecting" | "secure";
  /** Target URL being routed through tunnel */
  targetUrl?: string;
  /** Session identifier */
  sessionId?: string;
  /** Latency in milliseconds */
  latency?: number;
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
 * { "success": true }
 * 
 * If locked → HTTP 403:
 * { "code": "session_locked", "error": "forbidden", "message": "Identity session is locked. Call POST /unlock first." }
 */
export type ConnectResponse = {
  /** True if connect succeeded */
  success: boolean;
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
 * { "status": "ok", "version": "0.4.0", "xxdkReady": false }
 */
export type HealthResponse = {
  /** "ok" if bridge is healthy */
  status: string;
  /** Bridge version */
  version: string;
  /** True if xxDK is ready */
  xxdkReady: boolean;
};

// =============================================================================
// UNLOCK ENDPOINTS
// =============================================================================

/**
 * GET /unlock/status - Lock state
 * 
 * @example
 * { "unlocked": true, "expiresAt": "...", "ttlRemainingSeconds": 899 }
 * { "unlocked": false }
 */
export type UnlockStatusResponse = {
  /** True if bridge is unlocked */
  unlocked: boolean;
  /** ISO 8601 expiry when unlocked */
  expiresAt?: string;
  /** TTL remaining in seconds */
  ttlRemainingSeconds?: number;
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
 * { "success": true, "expiresAt": "...", "ttlSeconds": 899 }
 */
export type UnlockResponse = {
  /** True if unlock succeeded */
  success: boolean;
  /** ISO 8601 unlock expiry */
  expiresAt?: string;
  /** TTL in seconds */
  ttlSeconds?: number;
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

// Legacy message type (deprecated - use MessageItem from messageTypes.ts)
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

// Import new message types
import type {
  MessageItem,
  InboxRequest,
  InboxResponse,
  ThreadRequest,
  ThreadResponse,
  SendMessageRequest,
  SendMessageResponse as NewSendMessageResponse,
  IssueSessionRequest,
  IssueSessionResponse,
  SessionPurpose,
} from "./messageTypes";

export type {
  MessageItem,
  InboxRequest,
  InboxResponse,
  ThreadRequest,
  ThreadResponse,
  SendMessageRequest,
  IssueSessionRequest,
  IssueSessionResponse,
  SessionPurpose,
};

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
  
  // Session issuance (Phase-1 messaging)
  /** POST /session/issue - obtain sessionId for messaging operations */
  issueSession(req: IssueSessionRequest): Promise<IssueSessionResponse>;
  
  // Messages (Phase-1 contract)
  /** POST /message/inbox - queue view (available messages only) */
  fetchInbox(req?: { limit?: number }): Promise<InboxResponse>;
  /** POST /message/thread - history view for a conversation */
  fetchThread(req: { conversationId: string; limit?: number }): Promise<ThreadResponse>;
  /** POST /message/send - queue outbound message */
  sendMessage(req: { conversationId: string; plaintextB64: string }): Promise<NewSendMessageResponse>;
  
  // Legacy methods (deprecated)
  /** @deprecated Use fetchInbox instead */
  getInbox(): Promise<Message[]>;
}
