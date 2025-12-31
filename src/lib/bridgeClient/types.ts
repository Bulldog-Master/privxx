// src/lib/bridgeClient/types.ts

export type BridgeState = "starting" | "ready" | "error";

export type HealthResponse = { ok: true };

export type StatusResponse = {
  state: BridgeState;
  detail?: string | null;
  now?: number;
};

export type SessionResponse = {
  userId: string;
  sessionValid: boolean;
  now?: number;
};

export type IdentityState = "none" | "locked" | "unlocked";

export type IdentityStatusResponse = {
  exists: boolean;
  state: IdentityState;
  expiresAt?: string | null;
};

export type IdentityCreateResponse = { state: "locked" };

export type IdentityUnlockResponse = { state: "unlocked"; expiresAt: string };

export type SendMessageRequest = {
  recipient: string;
  message: string;
};

export type SendMessageResponse = {
  messageId: string;
  queued: true;
};

export type InboxMessage = {
  id: string;
  from: string;
  body: string;
  timestamp: number;
};

export type InboxResponse = {
  messages: InboxMessage[];
};

export type BridgeError =
  | { error: "unauthorized"; message: string }
  | { error: "forbidden"; message: string }
  | { error: "session_expired"; message: string }
  | { error: string; message: string };
