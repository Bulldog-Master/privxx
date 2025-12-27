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

export interface IBridgeClient {
  status(): Promise<StatusResponse>;
  unlock(password: string): Promise<void>;
  lock(): Promise<void>;
  sendMessage(recipient: string, message: string): Promise<string>;
  receiveMessages(): Promise<Message[]>;
  refreshSession(): Promise<SessionRefreshResponse>;
  setToken(token: string): void;
}

export class BridgeClient implements IBridgeClient {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...options.headers,
      },
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      throw new Error(
        (errorBody as { error?: string }).error || `HTTP ${res.status}`
      );
    }

    return res.json();
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
}
