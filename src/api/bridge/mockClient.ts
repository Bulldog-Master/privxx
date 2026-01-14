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
  InboxRequest,
  InboxResponse,
  ThreadRequest,
  ThreadResponse,
  SendMessageRequest,
  MessageItem,
} from "./types";
import type { SendMessageResponse } from "./messageTypes";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockBridgeClient implements IBridgeClient {
  private mockMessages: MessageItem[] = [];
  private legacyMessages: Message[] = [];
  private locked = true;
  private unlockExpiresAt: string | null = null;
  private connectionState: "idle" | "connecting" | "secure" = "idle";
  private sessionId: string | null = null;

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
    this.sessionId = `sess_mock_${Date.now()}`;
    // Mock 15-minute session (899 seconds to match live bridge)
    const expiresAt = new Date(Date.now() + 899 * 1000).toISOString();
    this.unlockExpiresAt = expiresAt;
    
    // Add welcome message in new format
    const now = Math.floor(Date.now() / 1000);
    this.mockMessages = [
      {
        conversationId: "conv_system",
        payloadCiphertextB64: btoa("Welcome to Privxx (demo mode). Your identity is now unlocked."),
        envelopeFingerprint: `fp_welcome_${now}`,
        createdAtUnix: now,
        expiresAtUnix: now + 86400,
        state: "available",
      },
    ];
    
    // Also keep legacy messages for backward compat
    this.legacyMessages = [
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
    this.sessionId = null;
    this.mockMessages = [];
    this.legacyMessages = [];
    return { success: true };
  }

  // Phase-1 Message endpoints

  async fetchInbox(req: InboxRequest): Promise<InboxResponse> {
    await sleep(100);
    const limit = req.limit ?? 10;
    const availableMessages = this.mockMessages
      .filter(m => m.state === "available")
      .slice(0, limit);
    
    return {
      items: availableMessages.length > 0 ? availableMessages : null,
      serverTime: new Date().toISOString(),
    };
  }

  async fetchThread(req: ThreadRequest): Promise<ThreadResponse> {
    await sleep(100);
    const limit = req.limit ?? 10;
    const includeConsumed = req.includeConsumed ?? true;
    
    let threadMessages = this.mockMessages
      .filter(m => m.conversationId === req.conversationId);
    
    if (!includeConsumed) {
      threadMessages = threadMessages.filter(m => m.state === "available");
    }
    
    return {
      items: threadMessages.length > 0 ? threadMessages.slice(0, limit) : null,
      serverTime: new Date().toISOString(),
    };
  }

  async sendMessage(req: SendMessageRequest): Promise<SendMessageResponse> {
    await sleep(150);
    const now = Math.floor(Date.now() / 1000);
    const messageId = `msg_mock_${now}`;
    
    // Add to mock messages
    const newMessage: MessageItem = {
      conversationId: `conv_${req.recipient}`,
      payloadCiphertextB64: btoa(req.message),
      envelopeFingerprint: `fp_${messageId}`,
      createdAtUnix: now,
      expiresAtUnix: now + 86400 * 30, // 30 days
      state: "available",
    };
    
    this.mockMessages.unshift(newMessage);
    
    // Simulate echo for "self" recipient
    if (req.recipient === "self" || req.recipient === "me") {
      setTimeout(() => {
        const echoMessage: MessageItem = {
          conversationId: `conv_${req.recipient}`,
          payloadCiphertextB64: btoa(`Echo: ${req.message}`),
          envelopeFingerprint: `fp_echo_${Date.now()}`,
          createdAtUnix: Math.floor(Date.now() / 1000),
          expiresAtUnix: Math.floor(Date.now() / 1000) + 86400 * 30,
          state: "available",
        };
        this.mockMessages.unshift(echoMessage);
      }, 500);
    }
    
    console.debug("[MockBridge] Send:", { recipient: req.recipient, messageId });
    
    return {
      messageId,
      status: "queued",
      serverTime: new Date().toISOString(),
    };
  }

  // Legacy method (deprecated)
  async getInbox(): Promise<Message[]> {
    await sleep(100);
    return [...this.legacyMessages];
  }
}
