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
  private mockMessages: Message[] = [];

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
    // Add welcome message on unlock
    this.mockMessages = [
      {
        from: "system",
        message: "Welcome to Privxx (demo mode). Try sending a message to yourself!",
        timestamp: new Date().toISOString(),
      },
    ];
  }

  async lock(): Promise<void> {
    await sleep(100);
    // Clear messages on lock
    this.mockMessages = [];
  }

  async sendMessage(recipient: string, message: string): Promise<string> {
    await sleep(150);
    const msgId = `mock-${Date.now()}`;
    
    // In demo mode, "send to self" echoes the message back
    if (recipient === "self" || recipient === "me") {
      // Simulate receiving the message back after a short delay
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

  async receiveMessages(): Promise<Message[]> {
    await sleep(100);
    return [...this.mockMessages];
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

  setAuthSecret(_secret: string): void {
    // No-op in mock mode
  }
}
