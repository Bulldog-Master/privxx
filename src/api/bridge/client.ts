/**
 * Privxx Bridge Client SDK
 * 
 * AUTHORITATIVE — Architecture Locked
 * Frontend → Bridge → Backend (xxdk)
 */

export type StatusResponse = {
  status: "ok";
  backend: "connected" | "disconnected";
  network: "ready" | "syncing";
};

export type Message = {
  from: string;
  message: string;
  timestamp: string;
};

export type UnlockResponse = {
  unlocked: boolean;
};

export type LockResponse = {
  locked: boolean;
};

export type SendResponse = {
  msg_id: string;
  status: "queued";
};

export type SessionRefreshResponse = {
  token: string;
  expires_in: number;
};

export interface BridgeClientConfig {
  baseUrl: string;
  authSecret?: string; // X-Privxx-Auth header value
}

export interface IBridgeClient {
  status(): Promise<StatusResponse>;
  unlock(password: string): Promise<void>;
  lock(): Promise<void>;
  sendMessage(recipient: string, message: string): Promise<string>;
  receiveMessages(): Promise<Message[]>;
  refreshSession(): Promise<SessionRefreshResponse>;
  setToken(token: string): void;
  setAuthSecret(secret: string): void;
}

export class BridgeClient implements IBridgeClient {
  private baseUrl: string;
  private token?: string;
  private authSecret?: string;

  constructor(config: BridgeClientConfig | string) {
    if (typeof config === "string") {
      this.baseUrl = config;
    } else {
      this.baseUrl = config.baseUrl;
      this.authSecret = config.authSecret;
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

    if (this.authSecret) {
      headers["X-Privxx-Auth"] = this.authSecret;
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

  async status(): Promise<StatusResponse> {
    return this.request("/status");
  }

  async unlock(password: string): Promise<void> {
    await this.request<UnlockResponse>("/identity/unlock", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  }

  async lock(): Promise<void> {
    await this.request<LockResponse>("/identity/lock", { method: "POST" });
  }

  async sendMessage(recipient: string, message: string): Promise<string> {
    const res = await this.request<SendResponse>("/message/send", {
      method: "POST",
      body: JSON.stringify({ recipient, message }),
    });
    return res.msg_id;
  }

  async receiveMessages(): Promise<Message[]> {
    const res = await this.request<{ messages: Message[] }>("/message/receive");
    return res.messages;
  }

  async refreshSession(): Promise<SessionRefreshResponse> {
    return this.request<SessionRefreshResponse>("/session/refresh", {
      method: "POST",
    });
  }

  setToken(token: string): void {
    this.token = token;
  }

  setAuthSecret(secret: string): void {
    this.authSecret = secret;
  }
}
