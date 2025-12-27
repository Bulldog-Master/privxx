/**
 * Bridge API Types (C2 Production Model)
 * 
 * All requests require Authorization: Bearer <JWT>
 */

export type StatusResponse = {
  status: "ok";
  backend: "connected" | "disconnected";
  network: "ready" | "syncing";
};

export type SessionResponse = {
  userId: string;
  sessionValid: boolean;
};

export type IdentityState = "none" | "locked" | "unlocked";

export type IdentityStatusResponse = {
  exists: boolean;
  state: IdentityState;
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
}

export interface IBridgeClient {
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
