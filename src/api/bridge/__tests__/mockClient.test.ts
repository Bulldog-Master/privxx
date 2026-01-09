/**
 * Mock Bridge Client Tests
 * 
 * Tests for the unlock/lock flow matching the new API schema.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MockBridgeClient } from "@/api/bridge/mockClient";

describe("MockBridgeClient", () => {
  let client: MockBridgeClient;

  beforeEach(() => {
    client = new MockBridgeClient();
  });

  describe("health endpoint", () => {
    it("returns status ok and version", async () => {
      const result = await client.health();
      expect(result.status).toBe("ok");
      expect(result.version).toBeDefined();
      expect(typeof result.xxdkReady).toBe("boolean");
    });
  });

  describe("unlock status endpoint", () => {
    it("returns unlocked: false when locked", async () => {
      const result = await client.getUnlockStatus();
      expect(result.unlocked).toBe(false);
      expect(result.expiresAt).toBeUndefined();
      expect(result.ttlRemainingSeconds).toBeUndefined();
    });

    it("returns unlocked: true with expiresAt and ttlRemainingSeconds after unlock", async () => {
      await client.unlock("test-password");
      const result = await client.getUnlockStatus();
      
      expect(result.unlocked).toBe(true);
      expect(result.expiresAt).toBeDefined();
      expect(typeof result.ttlRemainingSeconds).toBe("number");
      expect(result.ttlRemainingSeconds).toBeGreaterThan(0);
    });
  });

  describe("unlock endpoint", () => {
    it("returns success: true with expiresAt and ttlSeconds: 899", async () => {
      const result = await client.unlock("test-password");
      
      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeDefined();
      expect(result.ttlSeconds).toBe(899);
    });

    it("changes status from locked to unlocked", async () => {
      const beforeStatus = await client.getUnlockStatus();
      expect(beforeStatus.unlocked).toBe(false);
      
      await client.unlock("test-password");
      
      const afterStatus = await client.getUnlockStatus();
      expect(afterStatus.unlocked).toBe(true);
    });
  });

  describe("lock endpoint", () => {
    it("returns success: true", async () => {
      await client.unlock("test-password");
      const result = await client.lock();
      expect(result.success).toBe(true);
    });

    it("flips unlocked back to false", async () => {
      await client.unlock("test-password");
      const beforeLock = await client.getUnlockStatus();
      expect(beforeLock.unlocked).toBe(true);
      
      await client.lock();
      
      const afterLock = await client.getUnlockStatus();
      expect(afterLock.unlocked).toBe(false);
    });
  });

  describe("connect endpoint", () => {
    it("returns success: true", async () => {
      const result = await client.connect("https://example.com");
      expect(result.success).toBe(true);
    });
  });

  describe("status endpoint", () => {
    it("returns idle state initially", async () => {
      const result = await client.status();
      expect(result.state).toBe("idle");
    });

    it("returns secure state with targetUrl, sessionId, latency after connect", async () => {
      await client.connect("https://example.com");
      const result = await client.status();
      
      expect(result.state).toBe("secure");
      expect(result.targetUrl).toBeDefined();
      expect(result.sessionId).toBeDefined();
      expect(result.sessionId).toMatch(/^sim-/);
      expect(typeof result.latency).toBe("number");
    });
  });

  describe("disconnect endpoint", () => {
    it("returns state: idle after disconnect", async () => {
      await client.connect("https://example.com");
      const result = await client.disconnect();
      expect(result.state).toBe("idle");
    });
  });
});
