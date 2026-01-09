/**
 * Mock Bridge Client for Offline Development (C2 Model)
 * 
 * Simulates bridge behavior when VITE_MOCK=true
 */

import type {
  StatusResponse,
  UnlockStatusResponse,
  UnlockResponse,
  LockResponse,
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
      status: "ok",
      version: "0.4.0-mock",
      xxdkReady: false,
    };
  }

  // Status (requires auth)
  async status(): Promise<StatusResponse> {
    await sleep(100);
    return {
      state: this.connectionState,
      targetUrl: this.connectionState === "secure" ? "https://example.com" : undefined,
      sessionId: this.connectionState === "secure" ? `sim-${Date.now()}` : undefined,
      latency: this.connectionState === "secure" ? Math.floor(Math.random() * 200) + 50 : undefined,
    };
  }

  // Connection (mock)
  async connect(_targetUrl: string): Promise<ConnectResponse> {
    await sleep(500);
    this.connectionState = "secure";
    return {
      success: true,
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
    const ttlRemainingSeconds = this.unlockExpiresAt 
      ? Math.max(0, Math.floor((new Date(this.unlockExpiresAt).getTime() - Date.now()) / 1000))
      : undefined;
    return {
      unlocked: !this.locked,
      expiresAt: this.unlockExpiresAt || undefined,
      ttlRemainingSeconds,
    };
  }

  async unlock(_password: string): Promise<UnlockResponse> {
    await sleep(300);
    this.locked = false;
    // Mock 15-minute session (899 seconds to match live bridge)
    const expiresAt = new Date(Date.now() + 899 * 1000).toISOString();
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
      ttlSeconds: 899,
    };
  }

  async lock(): Promise<LockResponse> {
    await sleep(100);
    this.locked = true;
    this.unlockExpiresAt = null;
    this.mockMessages = [];
    return { success: true };
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
