/**
 * Bridge API Types (C2 Production Model)
 * 
 * ARCHITECTURE:
 * - Frontend → Bridge (public) → Backend (private localhost)
 * - All requests require Authorization: Bearer <JWT>
 * 
 * ENDPOINTS (Bridge Public):
 * - GET /health
 * - GET /xxdk/info
 * - GET /cmixx/status
 */

export type StatusResponse = {
  status: "ok";
  backend: "connected" | "disconnected";
  network: "ready" | "syncing";
};

// GET /health response
export type HealthResponse = {
  ok: boolean;
  service: string;
  version: string;
  time: string;
};

// GET /xxdk/info response
export type XxdkInfoResponse = {
  ok: boolean;
  mode: "real" | "demo";
  hasIdentity: boolean;
  receptionId?: string;
  ready: boolean;
  timestamp: number;
};

// GET /cmixx/status response
export type CmixxStatusResponse = {
  ok: boolean;
  mode: "real" | "demo";
  connected: boolean;
  lastRoundId?: number;
  nodeCount?: number;
  timestamp: number;
};

export type SessionResponse = {
  userId: string;
  sessionValid: boolean;
};

export type IdentityState = "none" | "locked" | "unlocked";

export type IdentityStatusResponse = {
  exists: boolean;
  state: IdentityState;
  publicId?: string; // cMixx public ID (base64)
};

export type IdentityCreateResponse = {
  state: IdentityState;
};

export type IdentityUnlockResponse = {
  state: "unlocked";
  expiresAt: string; // ISO 8601
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
  // Health & Status (public endpoints)
  health(): Promise<HealthResponse>;
  xxdkInfo(): Promise<XxdkInfoResponse>;
  cmixxStatus(): Promise<CmixxStatusResponse>;
  
  // Session
  validateSession(): Promise<SessionResponse>;
  
  // Identity
  getIdentityStatus(): Promise<IdentityStatusResponse>;
  createIdentity(): Promise<IdentityCreateResponse>;
  unlockIdentity(): Promise<IdentityUnlockResponse>;
  lockIdentity(): Promise<IdentityLockResponse>;
  
  // Messages
  sendMessage(recipient: string, message: string): Promise<string>;
  getInbox(): Promise<Message[]>;
  
  // Token management
  setToken(token: string): void;
  clearToken?(): void;
  
  // Legacy compatibility
  status(): Promise<StatusResponse>;
}
