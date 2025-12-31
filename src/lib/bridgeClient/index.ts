// src/lib/bridgeClient/index.ts
import { defaultBridgeConfig, type BridgeClientConfig } from "./config";
import { bridgeFetch } from "./http";
import type {
  HealthResponse,
  StatusResponse,
  SessionResponse,
  IdentityStatusResponse,
  IdentityCreateResponse,
  IdentityUnlockResponse,
  SendMessageRequest,
  SendMessageResponse,
  InboxResponse,
} from "./types";

export class BridgeClient {
  private cfg: BridgeClientConfig;

  constructor(cfg: BridgeClientConfig = defaultBridgeConfig) {
    this.cfg = { ...defaultBridgeConfig, ...cfg };
  }

  health() {
    return bridgeFetch<HealthResponse>("/health", "GET", this.cfg);
  }

  status() {
    return bridgeFetch<StatusResponse>("/status", "GET", this.cfg);
  }

  session() {
    return bridgeFetch<SessionResponse>("/auth/session", "POST", this.cfg);
  }

  identityStatus() {
    return bridgeFetch<IdentityStatusResponse>("/identity/status", "GET", this.cfg);
  }

  identityCreate() {
    return bridgeFetch<IdentityCreateResponse>("/identity/create", "POST", this.cfg);
  }

  identityUnlock() {
    return bridgeFetch<IdentityUnlockResponse>("/identity/unlock", "POST", this.cfg);
  }

  identityLock() {
    return bridgeFetch<{}>("/identity/lock", "POST", this.cfg);
  }

  sendMessage(req: SendMessageRequest) {
    return bridgeFetch<SendMessageResponse>("/messages/send", "POST", this.cfg, req);
  }

  inbox() {
    return bridgeFetch<InboxResponse>("/messages/inbox", "GET", this.cfg);
  }
}

// Re-export types
export type {
  HealthResponse,
  StatusResponse,
  SessionResponse,
  IdentityStatusResponse,
  IdentityCreateResponse,
  IdentityUnlockResponse,
  SendMessageRequest,
  SendMessageResponse,
  InboxResponse,
  InboxMessage,
  BridgeState,
  IdentityState,
  BridgeError,
} from "./types";

export type { BridgeClientConfig } from "./config";

export { defaultBridgeConfig } from "./config";
