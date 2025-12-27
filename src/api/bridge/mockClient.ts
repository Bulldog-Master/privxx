/**
 * Mock Bridge Client for Offline Development
 * 
 * Simulates bridge behavior when VITE_MOCK=true or no bridge URL configured
 */

import type {
  StatusResponse,
  Message,
  SessionRefreshResponse,
  IBridgeClient,
} from "./client";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockBridgeClient implements IBridgeClient {
  private mockToken = `mock-token-${Date.now()}`;

  async status(): Promise<StatusResponse> {
    await sleep(100);
    return {
      status: "ok",
      backend: "connected",
      network: "ready",
    };
  }

  async unlock(_password: string): Promise<void> {
    await sleep(200);
    // In mock mode, any password works
  }

  async lock(): Promise<void> {
    await sleep(100);
  }

  async sendMessage(_recipient: string, message: string): Promise<string> {
    await sleep(150);
    console.log("[MockBridge] Send:", message);
    return `mock-msg-${Date.now()}`;
  }

  async receiveMessages(): Promise<Message[]> {
    await sleep(100);
    return [
      {
        from: "mock-user",
        message: "Welcome to Privxx (demo mode)",
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async refreshSession(): Promise<SessionRefreshResponse> {
    await sleep(50);
    this.mockToken = `mock-token-${Date.now()}`;
    return {
      token: this.mockToken,
      expires_in: 3600,
    };
  }

  setToken(_token: string): void {
    // No-op in mock mode
  }
}
