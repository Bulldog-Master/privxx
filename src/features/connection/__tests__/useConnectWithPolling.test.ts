/**
 * Connect Flow Integration Tests
 * 
 * Phase 1: Tests use /health endpoint (not /status).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useConnectWithPolling } from "@/features/connection/hooks/useConnectWithPolling";
import { bridgeClient } from "@/api/bridge";
import { SessionLockedError } from "@/api/bridge/client";

// Mock the bridge client
vi.mock("@/api/bridge", () => ({
  bridgeClient: {
    connect: vi.fn(),
    health: vi.fn(), // Phase 1: uses /health instead of /status
  },
  SessionLockedError: class SessionLockedError extends Error {
    code = "session_locked";
    statusCode = 403;
    constructor(message: string) {
      super(message);
      this.name = "SessionLockedError";
    }
  },
}));

describe("useConnectWithPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("happy path", () => {
    it("connects successfully and polls until xxdkReady", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const mockHealth = vi.mocked(bridgeClient.health);
      
      // Connect returns success (Phase-D envelope)
      mockConnect.mockResolvedValue({ v: 1, type: "connect_ack", requestId: "test-1", ack: true, status: "connected" });
      
      // First poll returns not ready, second returns ready
      mockHealth
        .mockResolvedValueOnce({ status: "ok", version: "0.4.0", xxdkReady: false })
        .mockResolvedValueOnce({ status: "ok", version: "0.4.0", xxdkReady: true });

      const { result } = renderHook(() => useConnectWithPolling());

      // Start connect
      await act(async () => {
        result.current.connect("https://example.com");
      });

      // Should be in connecting state first
      expect(result.current.isConnecting).toBe(true);

      // Wait for first health poll
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });

      // Advance timer for next poll (state becomes polling after connect succeeds)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });

      // Should be secure now (xxdkReady === true)
      expect(result.current.result.statusData?.state).toBe("secure");
      expect(result.current.result.statusData?.xxdkReady).toBe(true);
      expect(result.current.result.statusData?.version).toBe("0.4.0");
    });
  });

  describe("timeout after EXACTLY 10 attempts", () => {
    it("stops polling after exactly 10 attempts", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const mockHealth = vi.mocked(bridgeClient.health);
      
      mockConnect.mockResolvedValue({ v: 1, type: "connect_ack", requestId: "test-2", ack: true, status: "connected" });
      
      // Health always returns xxdkReady: false (never becomes ready)
      mockHealth.mockResolvedValue({ status: "ok", version: "0.4.0", xxdkReady: false });

      const { result } = renderHook(() => useConnectWithPolling());

      await act(async () => {
        result.current.connect("https://example.com");
      });

      // First poll is immediate (no timer needed) - flush microtasks
      await act(async () => {
        await Promise.resolve();
      });

      // 9 more polls at 1s intervals (total 10)
      for (let i = 0; i < 9; i++) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
      }

      expect(result.current.isTimeout).toBe(true);
      expect(result.current.result.error).toBe("Connection pending — try again");
      // Should be exactly 10 attempts
      expect(result.current.result.pollAttempt).toBe(10);
      // Verify health was called exactly 10 times
      expect(mockHealth).toHaveBeenCalledTimes(10);
    });
  });

  describe("session locked redirect", () => {
    it("calls onSessionLocked when 403 session_locked is received from connect", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const onSessionLocked = vi.fn();
      
      // Connect throws SessionLockedError
      mockConnect.mockRejectedValue(new SessionLockedError("Identity session is locked"));

      const { result } = renderHook(() => useConnectWithPolling(onSessionLocked));

      await act(async () => {
        await result.current.connect("https://example.com");
      });

      expect(result.current.isSessionLocked).toBe(true);
      expect(onSessionLocked).toHaveBeenCalled();
      expect(result.current.result.state).toBe("session_locked");
    });

    it("calls onSessionLocked when 403 session_locked is received during polling", async () => {
      const mockConnect = vi.mocked(bridgeClient.connect);
      const mockHealth = vi.mocked(bridgeClient.health);
      const onSessionLocked = vi.fn();
      
      mockConnect.mockResolvedValue({ v: 1, type: "connect_ack", requestId: "test-3", ack: true, status: "connected" });
      
      // First poll succeeds, second throws SessionLockedError
      mockHealth
        .mockResolvedValueOnce({ status: "ok", version: "0.4.0", xxdkReady: false })
        .mockRejectedValueOnce(new SessionLockedError("Session locked"));

      const { result } = renderHook(() => useConnectWithPolling(onSessionLocked));

      await act(async () => {
        result.current.connect("https://example.com");
      });

      // Wait for polls
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });

      expect(result.current.isSessionLocked).toBe(true);
      expect(onSessionLocked).toHaveBeenCalled();
    });
  });
});
