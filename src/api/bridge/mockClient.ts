/**
 * Mock Bridge Client for Offline Development (C2 Model)
 * 
 * Simulates bridge behavior when VITE_MOCK=true
 */

import type {
  StatusResponse,
  SessionResponse,
  IdentityStatusResponse,
  IdentityCreateResponse,
  IdentityUnlockResponse,
  IdentityLockResponse,
  Message,
  IBridgeClient,
  HealthResponse,
} from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockBridgeClient implements IBridgeClient {
  private mockMessages: Message[] = [];
  private identityExists = false;
  private identityState: "none" | "locked" | "unlocked" = "none";
  private unlockExpiresAt: string | null = null;
  private connectionState: "idle" | "connecting" | "secure" = "idle";

  // Health (public, no auth)
  async health(): Promise<HealthResponse> {
    await sleep(50);
    return {
      ok: true,
      service: "privxx-bridge-mock",
      version: "phase-d-mock",
      time: new Date().toISOString(),
    };
  }

  // Status (requires auth)
  async status(): Promise<StatusResponse> {
    await sleep(100);
    return {
      state: this.connectionState,
      connectedAt: this.connectionState === "secure" ? new Date().toISOString() : undefined,
    };
  }

  async validateSession(): Promise<SessionResponse> {
    await sleep(50);
    return {
      userId: "mock-user-id",
      sessionValid: true,
    };
  }

  async getIdentityStatus(): Promise<IdentityStatusResponse> {
    await sleep(100);
    return {
      exists: this.identityExists,
      state: this.identityState,
    };
  }

  async createIdentity(): Promise<IdentityCreateResponse> {
    await sleep(500);
    this.identityExists = true;
    this.identityState = "locked";
    return {
      state: "locked",
    };
  }

  async unlockIdentity(): Promise<IdentityUnlockResponse> {
    await sleep(300);
    this.identityState = "unlocked";
    // Mock 15-minute session
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    this.unlockExpiresAt = expiresAt;
    
    // Add welcome message on unlock
    this.mockMessages = [
      {
        from: "system",
        message: "Welcome to Privxx (demo mode). Your identity is now unlocked.",
        timestamp: new Date().toISOString(),
      },
    ];
    
    return {
      state: "unlocked",
      expiresAt,
    };
  }

  async lockIdentity(): Promise<IdentityLockResponse> {
    await sleep(100);
    this.identityState = "locked";
    this.unlockExpiresAt = null;
    this.mockMessages = [];
    return {
      state: "locked",
    };
  }

  async sendMessage(recipient: string, message: string): Promise<string> {
    await sleep(150);
    const msgId = `mock-${Date.now()}`;
    
    // In demo mode, "send to self" echoes the message back
    if (recipient === "self" || recipient === "me") {
      setTimeout(() => {
        this.mockMessages.unshift({
          from: "me",
          message: message,
          timestamp: new Date().toISOString(),
        });
      }, 500);
    }
    
    console.debug("[MockBridge] Send:", { recipient, message, msgId });
    return msgId;
  }

  async getInbox(): Promise<Message[]> {
    await sleep(100);
    return [...this.mockMessages];
  }

  setToken(_token: string): void {
    // No-op in mock mode
  }
}
