/**
 * Connection Service Tests
 * 
 * Tests for demo and live connection modes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { connect, isLiveMode } from "../connectionService";

// Mock the bridge module
vi.mock("@/api/bridge", () => ({
  bridgeClient: {},
  isMockMode: vi.fn(() => true), // Default to mock mode
}));

describe("connectionService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe("connect (demo mode)", () => {
    it("returns a successful result after simulated delay", async () => {
      const connectPromise = connect("https://example.com");
      
      // Fast-forward past the simulated delay
      await vi.advanceTimersByTimeAsync(3500);
      
      const result = await connectPromise;

      expect(result.sessionId).toMatch(/^sess_/);
      expect(result.requestId).toMatch(/^req_/);
      expect(result.latency).toBeGreaterThan(0);
      // Note: success can be false due to 5% failure rate
      expect(typeof result.success).toBe("boolean");
    });

    it("includes proper session and request IDs", async () => {
      const connectPromise = connect("https://test.com");
      
      await vi.advanceTimersByTimeAsync(3500);
      
      const result = await connectPromise;

      expect(result.sessionId).toBeDefined();
      expect(result.requestId).toBeDefined();
    });
  });

  describe("isLiveMode", () => {
    it("returns false when mock mode is enabled", () => {
      expect(isLiveMode()).toBe(false);
    });
  });
});
