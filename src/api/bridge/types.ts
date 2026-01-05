/**
 * Bridge API Types (C2 Production Model)
 * 
 * ARCHITECTURE:
 * - Frontend → Bridge (public) → Backend (private localhost)
 * - All requests require Authorization: Bearer <JWT>
 * 
 * VALID ENDPOINTS (Bridge Public):
 * - GET  /health        (public, no auth)
 * - GET  /status        (requires auth)
 * - GET  /unlock/status (requires auth)
 * - POST /unlock        (requires auth)
 * - POST /connect       (requires auth)
 * - POST /disconnect    (requires auth)
 */

// GET /status response
export type StatusResponse = {
  state: "idle" | "connecting" | "secure";
  connectedAt?: string;
  targetUrl?: string;
};

// POST /connect request
export type ConnectRequest = {
  targetUrl: string; // Always "http://127.0.0.1:8090" - local to VPS
};

// POST /connect response
export type ConnectResponse = {
  state: "connecting" | "secure";
  message?: string;
};

// POST /disconnect response
export type DisconnectResponse = {
  state: "idle";
  message?: string;
};

// GET /health response (public, no auth)
export type HealthResponse = {
  ok: boolean;
  service: string;
  version: string;
  time: string;
};

// GET /unlock/status response
export type UnlockStatusResponse = {
  locked: boolean;
  expiresAt?: string; // ISO 8601 when unlocked
};

// POST /unlock request
export type UnlockRequest = {
  password: string;
};

// POST /unlock response
export type UnlockResponse = {
  success: boolean;
  expiresAt?: string; // ISO 8601
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
}

export interface IBridgeClient {
  // Health (public, no auth)
  health(): Promise<HealthResponse>;
  
  // Status (requires auth)
  status(): Promise<StatusResponse>;
  
  // Connection (requires auth)
  connect(): Promise<ConnectResponse>;
  disconnect(): Promise<DisconnectResponse>;
  
  // Unlock (requires auth)
  getUnlockStatus(): Promise<UnlockStatusResponse>;
  unlock(password: string): Promise<UnlockResponse>;
  
  // Messages (future)
  sendMessage(recipient: string, message: string): Promise<string>;
  getInbox(): Promise<Message[]>;
}
