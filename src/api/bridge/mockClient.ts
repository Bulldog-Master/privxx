/**
 * Mock Bridge Client for Offline Development (C2 Model)
 * 
 * Simulates bridge behavior when VITE_MOCK=true
 */

import type {
  StatusResponse,
  UnlockStatusResponse,
  UnlockResponse,
  Message,
  IBridgeClient,
  HealthResponse,
  ConnectResponse,
  DisconnectResponse,
} from "./types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockBridgeClient implements IBridgeClient {
  private mockMessages: Message[] = [];
  private locked = true;
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

  // Connection (mock)
  async connect(): Promise<ConnectResponse> {
    await sleep(500);
    this.connectionState = "secure";
    return {
      state: "secure",
      message: "Mock connection established",
    };
  }

  async disconnect(): Promise<DisconnectResponse> {
    await sleep(200);
    this.connectionState = "idle";
    return {
      state: "idle",
      message: "Mock connection closed",
    };
  }

  // Unlock endpoints (mock)
  async getUnlockStatus(): Promise<UnlockStatusResponse> {
    await sleep(100);
    return {
      locked: this.locked,
      expiresAt: this.unlockExpiresAt || undefined,
    };
  }

  async unlock(_password: string): Promise<UnlockResponse> {
    await sleep(300);
    this.locked = false;
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
      success: true,
      expiresAt,
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

}
