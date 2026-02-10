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
  IBridgeClient,
  HealthResponse,
  ConnectAck,
  DisconnectResponse,
  InboxResponse,
  ThreadResponse,
  MessageItem,
  CreateConversationResponse,
} from "./types";
import type { SendMessageResponse, IssueSessionResponse } from "./messageTypes";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class MockBridgeClient implements IBridgeClient {
  private mockMessages: MessageItem[] = [];
  private locked = true;
  private unlockExpiresAt: string | null = null;
  private connectionState: "idle" | "connecting" | "secure" = "idle";
  private sessionCounter = 0;

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
  async connect(targetUrl: string): Promise<ConnectAck> {
    await sleep(500);
    this.connectionState = "secure";
    return {
      v: 1,
      type: "connect_ack",
      requestId: `mock-${Date.now()}`,
      sessionId: `sim-${Date.now()}`,
      ack: true,
      status: "connected",
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
    
    // Seed realistic test conversations with mixed states
    this.mockMessages = this.seedMockConversations();
    
    return {
      success: true,
      expiresAt,
      ttlSeconds: 899,
    };
  }

  /**
   * Seed 5 realistic conversations for Phase-1 UI testing:
   * - Mixed undeliveredCount (0, 1, 5, 120)
   * - Mixed lastSeenAtUnix (today + older)
   * - Mixed state (available + consumed)
   * - Ciphertext stays opaque
   */
  private seedMockConversations(): MessageItem[] {
    const now = Math.floor(Date.now() / 1000);
    const hourAgo = now - 3600;
    const dayAgo = now - 86400;
    const weekAgo = now - 86400 * 7;
    const expires = now + 86400 * 30;
    
    return [
      // Conversation 1: conv_alice - 5 undelivered (recent)
      { conversationId: "conv_alice", payloadCiphertextB64: btoa("encrypted-payload-1"), envelopeFingerprint: "fp_alice_1", createdAtUnix: now - 60, expiresAtUnix: expires, state: "available" },
      { conversationId: "conv_alice", payloadCiphertextB64: btoa("encrypted-payload-2"), envelopeFingerprint: "fp_alice_2", createdAtUnix: now - 120, expiresAtUnix: expires, state: "available" },
      { conversationId: "conv_alice", payloadCiphertextB64: btoa("encrypted-payload-3"), envelopeFingerprint: "fp_alice_3", createdAtUnix: now - 180, expiresAtUnix: expires, state: "available" },
      { conversationId: "conv_alice", payloadCiphertextB64: btoa("encrypted-payload-4"), envelopeFingerprint: "fp_alice_4", createdAtUnix: now - 240, expiresAtUnix: expires, state: "available" },
      { conversationId: "conv_alice", payloadCiphertextB64: btoa("encrypted-payload-5"), envelopeFingerprint: "fp_alice_5", createdAtUnix: now - 300, expiresAtUnix: expires, state: "available" },
      { conversationId: "conv_alice", payloadCiphertextB64: btoa("encrypted-old-msg"), envelopeFingerprint: "fp_alice_old", createdAtUnix: dayAgo, expiresAtUnix: expires, state: "consumed" },
      
      // Conversation 2: conv_bob - 1 undelivered (hour ago)
      { conversationId: "conv_bob", payloadCiphertextB64: btoa("encrypted-new"), envelopeFingerprint: "fp_bob_new", createdAtUnix: hourAgo, expiresAtUnix: expires, state: "available" },
      { conversationId: "conv_bob", payloadCiphertextB64: btoa("encrypted-history-1"), envelopeFingerprint: "fp_bob_1", createdAtUnix: hourAgo - 600, expiresAtUnix: expires, state: "consumed" },
      { conversationId: "conv_bob", payloadCiphertextB64: btoa("encrypted-history-2"), envelopeFingerprint: "fp_bob_2", createdAtUnix: hourAgo - 1200, expiresAtUnix: expires, state: "consumed" },
      
      // Conversation 3: conv_system - 0 undelivered (all consumed, older)
      { conversationId: "conv_system", payloadCiphertextB64: btoa("Welcome to Privxx (demo mode)."), envelopeFingerprint: "fp_system_1", createdAtUnix: weekAgo, expiresAtUnix: expires, state: "consumed" },
      { conversationId: "conv_system", payloadCiphertextB64: btoa("Your identity is secure."), envelopeFingerprint: "fp_system_2", createdAtUnix: weekAgo + 60, expiresAtUnix: expires, state: "consumed" },
      
      // Conversation 4: conv_carol - 120 undelivered (stress test for 99+ badge)
      ...Array.from({ length: 120 }, (_, i) => ({
        conversationId: "conv_carol",
        payloadCiphertextB64: btoa(`encrypted-bulk-${i}`),
        envelopeFingerprint: `fp_carol_${i}`,
        createdAtUnix: dayAgo - i * 10,
        expiresAtUnix: expires,
        state: "available" as const,
      })),
      
      // Conversation 5: conv_self - 0 undelivered (echo test, very old)
      { conversationId: "conv_self", payloadCiphertextB64: btoa("Test echo message"), envelopeFingerprint: "fp_self_1", createdAtUnix: weekAgo - 86400, expiresAtUnix: expires, state: "consumed" },
    ];
  }

  async lock(): Promise<LockResponse> {
    await sleep(100);
    this.locked = true;
    this.unlockExpiresAt = null;
    this.mockMessages = [];
    return { success: true };
  }

  // Phase-1 Conversation + Session + Message endpoints

  /** POST /conversation/create - create or get conversation (idempotent) */
  async createConversation(req: { peerFingerprint: string; peerRefEncryptedB64?: string }): Promise<CreateConversationResponse> {
    await sleep(50);
    return {
      conversationId: `conv_${req.peerFingerprint.slice(0, 8)}`,
      serverTime: new Date().toISOString(),
    };
  }

  /** POST /session/issue - obtain sessionId for messaging operations */
  async issueSession(req: { purpose: "message_receive" | "message_send"; conversationId?: string }): Promise<IssueSessionResponse> {
    await sleep(50);
    this.sessionCounter++;
    return {
      sessionId: `sess_mock_${req.purpose}_${this.sessionCounter}_${Date.now()}`,
      purpose: req.purpose,
      serverTime: new Date().toISOString(),
    };
  }

  /** POST /message/inbox - internally issues session */
  async fetchInbox(req?: { limit?: number }): Promise<InboxResponse> {
    await sleep(100);
    const limit = req?.limit ?? 10;
    const availableMessages = this.mockMessages
      .filter(m => m.state === "available")
      .slice(0, limit);
    
    return {
      items: availableMessages.length > 0 ? availableMessages : null,
      serverTime: new Date().toISOString(),
    };
  }

  /** POST /message/thread - internally issues session */
  async fetchThread(req: { conversationId: string; limit?: number }): Promise<ThreadResponse> {
    await sleep(100);
    const limit = req.limit ?? 10;
    
    const threadMessages = this.mockMessages
      .filter(m => m.conversationId === req.conversationId)
      .slice(0, limit);
    
    return {
      items: threadMessages.length > 0 ? threadMessages : null,
      serverTime: new Date().toISOString(),
    };
  }

  /** POST /message/send - Phase-1 contract: conversationId + plaintextB64 */
  async sendMessage(req: { conversationId: string; plaintextB64: string }): Promise<SendMessageResponse> {
    await sleep(150);
    const now = Math.floor(Date.now() / 1000);
    const messageId = `msg_mock_${now}`;
    
    // Add to mock messages
    const newMessage: MessageItem = {
      conversationId: req.conversationId,
      payloadCiphertextB64: req.plaintextB64, // Already base64
      envelopeFingerprint: `fp_${messageId}`,
      createdAtUnix: now,
      expiresAtUnix: now + 86400 * 30, // 30 days
      state: "consumed", // Sent messages are immediately consumed
    };
    
    this.mockMessages.unshift(newMessage);
    
    // Simulate echo for "conv_self" conversation
    if (req.conversationId === "conv_self") {
      setTimeout(() => {
        const echoMessage: MessageItem = {
          conversationId: req.conversationId,
          payloadCiphertextB64: btoa(`Echo: ${atob(req.plaintextB64)}`),
          envelopeFingerprint: `fp_echo_${Date.now()}`,
          createdAtUnix: Math.floor(Date.now() / 1000),
          expiresAtUnix: Math.floor(Date.now() / 1000) + 86400 * 30,
          state: "available",
        };
        this.mockMessages.unshift(echoMessage);
      }, 500);
    }
    
    console.debug("[MockBridge] Send:", { conversationId: req.conversationId });
    
    return {
      status: "Sent",
      serverTime: new Date().toISOString(),
    };
  }

  /** POST /message/ack - mark messages as consumed */
  async ackMessages(req: { conversationId: string; envelopeFingerprints: string[] }): Promise<{ acked: number; serverTime?: string }> {
    await sleep(50);
    let ackedCount = 0;
    
    this.mockMessages = this.mockMessages.map((msg) => {
      if (
        msg.conversationId === req.conversationId &&
        msg.state === "available" &&
        req.envelopeFingerprints.includes(msg.envelopeFingerprint)
      ) {
        ackedCount++;
        return { ...msg, state: "consumed" as const };
      }
      return msg;
    });
    
    console.debug("[MockBridge] Ack:", { conversationId: req.conversationId, acked: ackedCount });
    
    return {
      acked: ackedCount,
      serverTime: new Date().toISOString(),
    };
  }

}
