/**
 * Privxx Bridge Client SDK (C2 Production Model)
 * 
 * AUTHORITATIVE — Architecture Locked
 * Frontend → Bridge → Backend (xxdk)
 * 
 * All requests require Authorization: Bearer <JWT>
 */

import type {
  StatusResponse,
  SessionResponse,
  IdentityStatusResponse,
  IdentityCreateResponse,
  IdentityUnlockResponse,
  IdentityLockResponse,
  Message,
  MessageSendResponse,
  IBridgeClient,
  BridgeClientConfig,
} from "./types";

export class BridgeClient implements IBridgeClient {
  private baseUrl: string;
  private token?: string;

  constructor(config: BridgeClientConfig | string) {
    if (typeof config === "string") {
      this.baseUrl = config;
    } else {
      this.baseUrl = config.baseUrl;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const startTime = performance.now();
    const correlationId = crypto.randomUUID().slice(0, 8);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Correlation-Id": correlationId,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const latency = Math.round(performance.now() - startTime);

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        const errorMsg = (errorBody as { error?: string }).error || `HTTP ${res.status}`;
        console.debug(`[Bridge] ${path} failed (${latency}ms) [${correlationId}]:`, errorMsg);
        throw new Error(errorMsg);
      }

      console.debug(`[Bridge] ${path} ok (${latency}ms) [${correlationId}]`);
      return res.json();
    } catch (err) {
      const latency = Math.round(performance.now() - startTime);
      console.debug(`[Bridge] ${path} error (${latency}ms) [${correlationId}]:`, err);
      throw err;
    }
  }

  // Session
  async validateSession(): Promise<SessionResponse> {
    return this.request("/auth/session", { method: "POST" });
  }

  // Identity
  async getIdentityStatus(): Promise<IdentityStatusResponse> {
    return this.request("/identity/status");
  }

  async createIdentity(): Promise<IdentityCreateResponse> {
    return this.request("/identity/create", { method: "POST" });
  }

  async unlockIdentity(): Promise<IdentityUnlockResponse> {
    return this.request("/identity/unlock", { method: "POST" });
  }

  async lockIdentity(): Promise<IdentityLockResponse> {
    return this.request("/identity/lock", { method: "POST" });
  }

  // Messages
  async sendMessage(recipient: string, message: string): Promise<string> {
    const res = await this.request<MessageSendResponse>("/messages/send", {
      method: "POST",
      body: JSON.stringify({ recipient, message }),
    });
    return res.msg_id;
  }

  async getInbox(): Promise<Message[]> {
    const res = await this.request<{ messages: Message[] }>("/messages/inbox");
    return res.messages;
  }

  // Legacy compatibility
  async status(): Promise<StatusResponse> {
    return this.request("/status");
  }

  setToken(token: string): void {
    this.token = token;
  }
}

// Re-export types
export type {
  StatusResponse,
  SessionResponse,
  IdentityStatusResponse,
  IdentityCreateResponse,
  IdentityUnlockResponse,
  IdentityLockResponse,
  Message,
  MessageSendResponse,
  IBridgeClient,
  BridgeClientConfig,
} from "./types";
